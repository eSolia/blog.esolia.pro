// Cloudflare Worker entry point.
//
// Two responsibilities:
//   1. fetch()     — delegate every request to the Static Assets binding so
//                    the site is served from _site/ exactly as before.
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

interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN: string;
}

const REPO_OWNER = "eSolia";
const REPO_NAME = "blog.esolia.pro";
const REPO_BRANCH = "main";
const USER_AGENT = "blog-esolia-pro-rebuild-cron";

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },

  scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): void {
    ctx.waitUntil(triggerRebuild(env));
  },
};

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
