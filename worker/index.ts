// Cloudflare Worker entry point.
//
// Three responsibilities:
//   1. fetch()     — route POST /api/newsletter to the newsletter handler
//                    (Turnstile-gated signup); delegate everything else to the
//                    Static Assets binding so the site is served from _site/
//                    exactly as before.
//   2. scheduled() — once per day, push an empty commit to main via the
//                    GitHub API. CF Workers Builds (already connected to
//                    eSolia/blog.esolia.pro) sees the push and rebuilds.
//                    This refreshes time-dependent build artefacts such as
//                    `elapseddays` per post (computed in _config.ts).
//
// Manual one-time setup outside this file:
//   - Create a fine-grained GitHub PAT scoped to eSolia/blog.esolia.pro only,
//     permission: Contents = read & write.
//   - Bind it to the Worker:
//       deno run -A npm:wrangler@latest secret put GITHUB_TOKEN
//   - Create a Turnstile widget (Managed) for blog.esolia.pro and bind:
//       deno run -A npm:wrangler@latest secret put TURNSTILE_SECRET_KEY
//   - Bind the PROdb (dbFlex) API token — same value as the esolia-2025
//     contact-form Worker (shared appId 15331):
//       deno run -A npm:wrangler@latest secret put DBFLEX_API_KEY_01
//
// Minimal Cloudflare Workers types declared inline to avoid pulling in
// @cloudflare/workers-types and dueling tsconfigs with the Lume Deno setup.

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
  type: "scheduled";
}

// Native rate-limit binding (configured in wrangler.jsonc).
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN: string;
  TURNSTILE_SECRET_KEY: string;
  DBFLEX_API_KEY_01: string;
  NEWSLETTER_LIMIT: RateLimiter;
}

const REPO_OWNER = "eSolia";
const REPO_NAME = "blog.esolia.pro";
const REPO_BRANCH = "main";
const USER_AGENT = "blog-esolia-pro-rebuild-cron";

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/newsletter") {
      return request.method === "POST"
        ? handleNewsletter(request, env)
        : Promise.resolve(new Response("Method Not Allowed", { status: 405 }));
    }
    return env.ASSETS.fetch(request);
  },

  scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(triggerRebuild(env));
  },
};

// ---------------------------------------------------------------------------
// Newsletter signup handler
//
// InfoSec: Defense-in-depth gate on the "Stay Informed" signup. In order:
// origin allowlist, per-IP rate limit, honeypot + time-trap, Cloudflare
// Turnstile siteverify, then server-side email validation. Only then does it
// look up the address and create the record in PROdb (dbFlex) via the
// AUTHENTICATED TeamDesk API v2 — not the old public WebToRecord gateway. Every
// redirect target and the stored reference URL are constructed server-side from
// a fixed allowlist, never read from the request, so a caller cannot use this
// endpoint as an open redirect or inject an arbitrary reference. Mirrors
// ~/dev/esolia-2025 workers/contact-form.
//
// dbFlex writes use create.json (not upsert-on-match) because the Email column
// is not marked unique yet — TeamDesk rejects match on a non-unique column
// (code 3106). A pre-insert lookup gives friendly "already subscribed" feedback
// and avoids duplicates in the normal case. See the follow-up issue to clean
// the table, mark Email unique, and switch back to upsert.
// ---------------------------------------------------------------------------

const DBFLEX_API = "https://pro.dbflex.net/secure/api/v2/15331";
const NEWSLETTER_TABLE = "Email Newsletter Subscriber";
const EMAIL_FIELD = "f_64244897";
const REFERENCE_FIELD = "f_64244810";

// InfoSec: Stricter email regex — rejects consecutive dots, leading hyphens,
// etc. (shared with the esolia-2025 contact-form Worker).
const EMAIL_REGEX =
  /^(?!.*\.\.)(?!.*\.-)[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;

// Reject obvious throwaway inboxes before they reach PROdb.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "throwawaymail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
]);

const LOCALES = {
  ja: {
    reference: "https://blog.esolia.pro",
    thanks: "https://blog.esolia.pro/thank-you/",
    home: "https://blog.esolia.pro/",
  },
  en: {
    reference: "https://blog.esolia.pro/en/",
    thanks: "https://blog.esolia.pro/en/thank-you/",
    home: "https://blog.esolia.pro/en/",
  },
} as const;

// InfoSec: Only accept form posts originating from our own site.
const ALLOWED_ORIGINS = new Set(["https://blog.esolia.pro"]);

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } });
}

async function handleNewsletter(
  request: Request,
  env: Env,
): Promise<Response> {
  // 1. Origin allowlist.
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return new Response("Forbidden", { status: 403 });
  }

  // 2. Per-IP rate limit (native binding).
  const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rl = await env.NEWSLETTER_LIMIT.limit({ key: clientIp });
  if (!rl.success) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
    });
  }

  // 3. Parse the form and resolve locale (never trusted for redirects below —
  //    only used to select from the fixed LOCALES table).
  const form = await request.formData();
  const locale = form.get("locale") === "en" ? "en" : "ja";
  const l = LOCALES[locale];

  // 4. Honeypot — a hidden field only bots fill in. Respond as if successful so
  //    the bot gets no signal; store nothing.
  if (String(form.get("website") ?? "").trim() !== "") {
    console.log("newsletter honeypot triggered", { locale });
    return redirect(l.thanks);
  }

  // 5. Time trap — the form stamps `ts` (ms epoch) on page load. Reject submits
  //    that are impossibly fast (<2s) or from a stale page (>24h).
  const ts = Number(form.get("ts"));
  const age = Date.now() - ts;
  if (!Number.isFinite(ts) || age < 2000 || age > 86_400_000) {
    console.log("newsletter time trap triggered", { locale, age });
    return redirect(l.home + "?newsletter=error#panel-cta");
  }

  // 6. Turnstile verification.
  const token = form.get("cf-turnstile-response");
  if (!token) {
    return redirect(l.home + "?newsletter=error#panel-cta");
  }
  const verify = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientIp,
      }),
    },
  );
  const outcome = (await verify.json()) as TurnstileResponse;
  if (!outcome.success) {
    console.log("newsletter turnstile failed", {
      locale,
      errors: outcome["error-codes"],
    });
    return redirect(l.home + "?newsletter=error#panel-cta");
  }

  // 7. Server-side email sanity check.
  const email = String(form.get("email") ?? "").trim();
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  if (
    email.length === 0 || email.length > 254 || !EMAIL_REGEX.test(email) ||
    DISPOSABLE_DOMAINS.has(domain)
  ) {
    console.log("newsletter email rejected", { locale });
    return redirect(l.home + "?newsletter=error#panel-cta");
  }

  const dbHeaders = {
    "Authorization": `Bearer ${env.DBFLEX_API_KEY_01}`,
    "Content-Type": "application/json",
  };
  const tablePath = `${DBFLEX_API}/${encodeURIComponent(NEWSLETTER_TABLE)}`;

  // 8. Already-subscribed check. The Email column is not (yet) marked unique in
  //    dbFlex, so TeamDesk upsert-on-match is rejected (code 3106). Until it is
  //    (see follow-up issue), query for the address first: if it exists, tell
  //    the visitor they're already subscribed instead of creating a duplicate.
  //    On any query error we fall through to create — better a rare duplicate
  //    than a lost signup. Small race window for two simultaneous first-time
  //    signups of the same address; the eventual unique constraint mops it up.
  //    Email is validated above (no quotes/spaces), so the filter string is safe.
  try {
    const filter = encodeURIComponent(`[Email]="${email}"`);
    const found = await fetch(
      `${tablePath}/select.json?filter=${filter}&top=1`,
      { headers: dbHeaders },
    );
    if (found.ok) {
      const rows = (await found.json()) as unknown[];
      if (Array.isArray(rows) && rows.length > 0) {
        console.log("newsletter already subscribed", { locale });
        return redirect(l.home + "?newsletter=exists#panel-cta");
      }
    } else {
      console.error("newsletter dbFlex lookup failed", {
        locale,
        status: found.status,
      });
    }
  } catch (error) {
    console.error(
      "newsletter dbFlex lookup error",
      error instanceof Error ? error.message : "unknown",
    );
  }

  // 9. Create the subscriber record via the authenticated API. `reference`
  //    comes from the fixed LOCALES table, never the request.
  try {
    const resp = await fetch(`${tablePath}/create.json?workflow=1`, {
      method: "POST",
      headers: dbHeaders,
      body: JSON.stringify([
        { [EMAIL_FIELD]: email, [REFERENCE_FIELD]: l.reference },
      ]),
    });
    if (!resp.ok) {
      console.error("newsletter dbFlex create failed", {
        locale,
        status: resp.status,
      });
      return redirect(l.home + "?newsletter=error#panel-cta");
    }
  } catch (error) {
    console.error(
      "newsletter dbFlex create error",
      error instanceof Error ? error.message : "unknown",
    );
    return redirect(l.home + "?newsletter=error#panel-cta");
  }

  // 10. Success — full-page redirect to the existing thank-you page.
  return redirect(l.thanks);
}

async function triggerRebuild(env: Env): Promise<void> {
  const ghHeaders = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": USER_AGENT,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const apiBase = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

  const refResp = await fetch(`${apiBase}/git/ref/heads/${REPO_BRANCH}`, {
    headers: ghHeaders,
  });
  if (!refResp.ok) {
    throw new Error(
      `get ref failed: ${refResp.status} ${await refResp.text()}`,
    );
  }
  const ref = (await refResp.json()) as { object: { sha: string } };
  const parentSha = ref.object.sha;

  const commitResp = await fetch(`${apiBase}/git/commits/${parentSha}`, {
    headers: ghHeaders,
  });
  if (!commitResp.ok) {
    throw new Error(
      `get commit failed: ${commitResp.status} ${await commitResp.text()}`,
    );
  }
  const parent = (await commitResp.json()) as { tree: { sha: string } };

  const createResp = await fetch(`${apiBase}/git/commits`, {
    method: "POST",
    headers: { ...ghHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      message:
        "chore: nightly rebuild trigger\n\nInfoSec: no security impact — empty commit fired by Worker cron to refresh time-dependent build artefacts.",
      tree: parent.tree.sha,
      parents: [parentSha],
      author: {
        name: "blog-esolia-pro-cron",
        email: "noreply@esolia.pro",
        date: new Date().toISOString(),
      },
    }),
  });
  if (!createResp.ok) {
    throw new Error(
      `create commit failed: ${createResp.status} ${await createResp.text()}`,
    );
  }
  const newCommit = (await createResp.json()) as { sha: string };

  const updateResp = await fetch(`${apiBase}/git/refs/heads/${REPO_BRANCH}`, {
    method: "PATCH",
    headers: { ...ghHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });
  if (!updateResp.ok) {
    throw new Error(
      `update ref failed: ${updateResp.status} ${await updateResp.text()}`,
    );
  }
  console.log(`Triggered rebuild via empty commit ${newCommit.sha}`);
}
