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
    if (
      url.pathname === "/api/newsletter/verify" ||
      url.pathname === "/api/newsletter/unsubscribe"
    ) {
      const op: SubOp = url.pathname.endsWith("/unsubscribe")
        ? "unsubscribe"
        : "verify";
      if (request.method === "GET") {
        return renderConfirmPage(op, url, env);
      }
      if (request.method === "POST") {
        return handleSubOp(op, request, env);
      }
      return Promise.resolve(
        new Response("Method Not Allowed", { status: 405 }),
      );
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
// Identifier + state fields for the verify/unsubscribe flow. "§ Id" is the
// primary key, an AutoNumber with {GUID} format (32 hex, unguessable) for all
// current records — used as the opaque token in the subscriber emails.
const PK_COLUMN = "§ Id"; // TeamDesk filter/body column name
const PK_FIELD = "f_64244793"; // same column, API field id (for update body)
const SUBSCRIBED_FIELD = "f_64258005"; // "Subscribed?" checkbox
const VERIFIED_FIELD = "f_64360375"; // "Verified?" checkbox
// Accept a 32-hex GUID or a hyphenated UUID; rejects the legacy sequential
// "ENS-YYYYMMDD-NNN" ids (they never receive new verify emails) and any junk.
const PK_GUID_RE =
  /^(?:[0-9A-Fa-f]{32}|[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})$/;

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

// Parse a form body without throwing on missing/garbled bodies (e.g. an empty
// POST from a bot probe) — returns null instead of surfacing a 500.
async function parseForm(request: Request): Promise<FormData | null> {
  try {
    return await request.formData();
  } catch {
    return null;
  }
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
  const form = await parseForm(request);
  if (!form) {
    return new Response("Bad Request", { status: 400 });
  }
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

// ---------------------------------------------------------------------------
// Verify / unsubscribe handlers (double opt-in confirmation + unsubscribe)
//
// InfoSec: Replaces the public subops.html web-to-record. The link in the dbFlex
// email carries only the record's primary key (§ Id, a {GUID}). A GET renders a
// confirm page and NEVER mutates, so email security scanners / link-prefetchers
// (Outlook Safe Links, Mimecast, Slack/Teams unfurls, AV) cannot auto-verify or
// auto-unsubscribe. Mutation happens only on POST from the confirm button, and
// the Worker sets the new state from the route — it trusts nothing else from the
// URL (no Operation/Subscribed/Email params), closing the parameter-tampering
// hole of the old flow. The 128-bit GUID gates lookups; malformed ids never hit
// the API.
// ---------------------------------------------------------------------------

type SubOp = "verify" | "unsubscribe";
type Loc = "ja" | "en";

interface SubRecord {
  "§ Id": string;
  "Subscribed?": boolean;
  "Verified?": boolean;
  "Reference"?: string;
}

const SUB_STRINGS: Record<SubOp, Record<Loc, Record<string, string>>> = {
  verify: {
    ja: {
      confirmTitle: "メール配信の登録確認",
      confirmBody: "下のボタンを押して、メール配信の登録を確定してください。",
      confirmButton: "登録を確定する",
      successTitle: "登録が完了しました",
      success: "ご登録ありがとうございます。メール配信の登録が確定されました。",
      doneTitle: "確認済みです",
      already: "このメールアドレスは既に確認済みです。",
    },
    en: {
      confirmTitle: "Confirm your subscription",
      confirmBody:
        "Press the button below to confirm your newsletter subscription.",
      confirmButton: "Confirm subscription",
      successTitle: "Subscription confirmed",
      success: "Thank you — your newsletter subscription is now confirmed.",
      doneTitle: "Already confirmed",
      already: "This email address has already been confirmed.",
    },
  },
  unsubscribe: {
    ja: {
      confirmTitle: "配信停止の確認",
      confirmBody: "下のボタンを押して、メール配信の停止を確定してください。",
      confirmButton: "配信を停止する",
      successTitle: "配信を停止しました",
      success: "メール配信を停止しました。ご利用ありがとうございました。",
      doneTitle: "停止済みです",
      already: "このメールアドレスは既に配信停止済みです。",
    },
    en: {
      confirmTitle: "Confirm unsubscribe",
      confirmBody:
        "Press the button below to confirm you want to stop receiving the newsletter.",
      confirmButton: "Unsubscribe",
      successTitle: "You've been unsubscribed",
      success: "You will no longer receive the newsletter. Thank you.",
      doneTitle: "Already unsubscribed",
      already: "This email address is already unsubscribed.",
    },
  },
};

// Locale-neutral fallbacks (used when there's no record to infer locale from).
const SUB_INVALID = {
  ja: {
    title: "リンクが無効です",
    body: "このリンクは無効か、有効期限が切れています。",
  },
  en: {
    title: "Invalid link",
    body: "This link is invalid or has expired.",
  },
};
const SUB_ERROR = {
  ja: {
    title: "エラーが発生しました",
    body:
      "処理中にエラーが発生しました。しばらくしてからもう一度お試しください。",
  },
  en: {
    title: "Something went wrong",
    body: "An error occurred. Please try again in a little while.",
  },
};

function subDbHeaders(env: Env): Record<string, string> {
  return {
    "Authorization": `Bearer ${env.DBFLEX_API_KEY_01}`,
    "Content-Type": "application/json",
  };
}

function localeOf(rec: SubRecord): Loc {
  return (rec.Reference ?? "").includes("/en") ? "en" : "ja";
}

// Self-contained, theme-aware HTML page for the verify/unsubscribe flow.
function subPage(
  loc: Loc,
  title: string,
  body: string,
  form: string,
  status = 200,
): Response {
  const html = `<!DOCTYPE html><html lang="${loc}"><head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex">` +
    `<title>${title}</title><style>` +
    `:root{color-scheme:light dark}` +
    `body{margin:0;min-height:100vh;display:grid;place-items:center;` +
    `font-family:system-ui,-apple-system,"Hiragino Kaku Gothic ProN",Meiryo,sans-serif;` +
    `background:#fafafa;color:#18181b}` +
    `@media(prefers-color-scheme:dark){body{background:#18181b;color:#e4e4e7}}` +
    `main{max-width:30rem;margin:1.5rem;padding:2rem;border-radius:1rem;` +
    `border:1px solid #e4e4e7;text-align:center}` +
    `@media(prefers-color-scheme:dark){main{border-color:#3f3f46}}` +
    `.logo{margin:0 0 1.5rem}` +
    `.logo img{height:28px;width:auto;display:inline-block}` +
    // Dark-blue logo has no white variant; on the dark theme sit it on a white
    // chip so it stays legible.
    `@media(prefers-color-scheme:dark){.logo img{background:#fff;` +
    `padding:.45rem .75rem;border-radius:.5rem}}` +
    `h1{font-size:1.15rem;margin:0 0 .75rem}` +
    `p{font-size:.95rem;line-height:1.65;color:#52525b;margin:0}` +
    `@media(prefers-color-scheme:dark){p{color:#a1a1aa}}` +
    `button{margin-top:1.25rem;padding:.6rem 1.4rem;font-size:.95rem;font-weight:600;` +
    `color:#fff;background:#0ea5e9;border:0;border-radius:.5rem;cursor:pointer}` +
    `button:hover{background:#0284c7}` +
    `</style></head><body><main>` +
    `<p class="logo"><img src="/assets/logo_horiz_darkblue_bgtransparent.svg" ` +
    `alt="eSolia" width="106" height="28"></p>` +
    `<h1>${title}</h1><p>${body}</p>${form}</main></body></html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}

// Look a subscriber up by its primary key (§ Id GUID). Caller must have already
// validated `guid` against PK_GUID_RE, so the filter string is injection-safe.
async function lookupByGuid(guid: string, env: Env): Promise<SubRecord | null> {
  const filter = encodeURIComponent(`[${PK_COLUMN}]="${guid}"`);
  const url =
    `${DBFLEX_API}/${encodeURIComponent(NEWSLETTER_TABLE)}/select.json` +
    `?filter=${filter}&top=1`;
  const resp = await fetch(url, { headers: subDbHeaders(env) });
  if (!resp.ok) {
    console.error("newsletter suboperation lookup failed", {
      status: resp.status,
    });
    return null;
  }
  const rows = (await resp.json()) as SubRecord[];
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// GET — render a confirm page. Read-only: never mutates, so scanner prefetch is
// harmless.
async function renderConfirmPage(
  op: SubOp,
  url: URL,
  env: Env,
): Promise<Response> {
  const guid = url.searchParams.get("guid") ?? "";
  if (!PK_GUID_RE.test(guid)) {
    return subPage("ja", SUB_INVALID.ja.title, SUB_INVALID.ja.body, "", 400);
  }
  const rec = await lookupByGuid(guid, env);
  if (!rec) {
    return subPage("ja", SUB_INVALID.ja.title, SUB_INVALID.ja.body, "", 404);
  }
  const loc = localeOf(rec);
  const s = SUB_STRINGS[op][loc];
  const already = op === "verify"
    ? rec["Verified?"] === true
    : rec["Subscribed?"] === false;
  if (already) {
    return subPage(loc, s.doneTitle, s.already, "");
  }
  const form = `<form method="POST" action="/api/newsletter/${op}">` +
    `<input type="hidden" name="guid" value="${guid}">` +
    `<button type="submit">${s.confirmButton}</button></form>`;
  return subPage(loc, s.confirmTitle, s.confirmBody, form);
}

// POST — perform the state change. Trusts only the GUID; the new state is fixed
// by the route (verify → Subscribed+Verified true; unsubscribe → Subscribed
// false).
async function handleSubOp(
  op: SubOp,
  request: Request,
  env: Env,
): Promise<Response> {
  const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rl = await env.NEWSLETTER_LIMIT.limit({ key: `subop:${clientIp}` });
  if (!rl.success) {
    return subPage("ja", SUB_ERROR.ja.title, SUB_ERROR.ja.body, "", 429);
  }
  const form = await parseForm(request);
  const guid = form ? String(form.get("guid") ?? "") : "";
  if (!PK_GUID_RE.test(guid)) {
    return subPage("ja", SUB_INVALID.ja.title, SUB_INVALID.ja.body, "", 400);
  }
  const rec = await lookupByGuid(guid, env);
  if (!rec) {
    return subPage("ja", SUB_INVALID.ja.title, SUB_INVALID.ja.body, "", 404);
  }
  const loc = localeOf(rec);
  const s = SUB_STRINGS[op][loc];
  const already = op === "verify"
    ? rec["Verified?"] === true
    : rec["Subscribed?"] === false;
  if (already) {
    return subPage(loc, s.doneTitle, s.already, "");
  }

  // Update by primary key (§ Id is the table's key column).
  const fields = op === "verify"
    ? { [SUBSCRIBED_FIELD]: true, [VERIFIED_FIELD]: true }
    : { [SUBSCRIBED_FIELD]: false };
  try {
    const resp = await fetch(
      `${DBFLEX_API}/${
        encodeURIComponent(NEWSLETTER_TABLE)
      }/update.json?workflow=1`,
      {
        method: "POST",
        headers: subDbHeaders(env),
        body: JSON.stringify([{ [PK_FIELD]: guid, ...fields }]),
      },
    );
    if (!resp.ok) {
      console.error(`newsletter ${op} update failed`, { status: resp.status });
      return subPage(loc, SUB_ERROR[loc].title, SUB_ERROR[loc].body, "", 502);
    }
  } catch (error) {
    console.error(
      `newsletter ${op} update error`,
      error instanceof Error ? error.message : "unknown",
    );
    return subPage(loc, SUB_ERROR[loc].title, SUB_ERROR[loc].body, "", 502);
  }
  return subPage(loc, s.successTitle, s.success, "");
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
