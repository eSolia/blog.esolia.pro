#!/usr/bin/env -S deno run --allow-net --allow-read
/**
 * Checks that this repo's robots.txt policy still matches esolia-2025's.
 *
 * Why this exists: the blog is served at esolia.co.jp/blog, and robots.txt is
 * read only at the origin root — so esolia-2025's file is the one crawlers
 * actually obey for blog content. This repo's copy is authoritative only when
 * the blog is reached directly (before the blog.esolia.pro Redirect Rule goes
 * live, and during a rollback). Two files, two repos, two formats, and nothing
 * else connecting them. This is the something else.
 *
 * What is compared: the `Content-Signal:` line and every AI-bot `User-agent`
 * block, read from the live esolia.co.jp/robots.txt. NOT the `Disallow:` lines under `User-agent: *` — those name real
 * paths and differ legitimately between the two sites (esolia-2025 disallows
 * /technical/security-acknowledgments/ and /blog/api/; the blog disallows
 * /api/, the same endpoints as it sees them).
 *
 * Run: deno task check:robots
 */

// The live file, not the source in GitHub: esolia-2025 is a private repo, so
// raw.githubusercontent.com would need a cross-repo token — and comparing
// against what is actually deployed is the better check anyway, since that is
// what crawlers read. A fetch failure exits 2, distinct from drift's 1, so an
// esolia.co.jp outage is never mistaken for a policy change.
const REMOTE = "https://esolia.co.jp/robots.txt";
const LOCAL = new URL("../src/robots.txt", import.meta.url);

interface Policy {
  contentSignal: string;
  botBlocks: string[];
}

/**
 * Pull the comparable policy out of a robots.txt body.
 */
function extractPolicy(text: string): Policy {
  const contentSignal = text.match(/^Content-Signal:.*$/mi)?.[0].trim() ?? "";

  // Every `User-agent: <name>` group other than the catch-all, with its rules,
  // normalized so comments and blank lines cannot cause a false mismatch.
  const botBlocks: string[] = [];
  const groupRe =
    /^User-agent:[ \t]*(?!\*)(\S+)[ \t]*$\n((?:^(?:Allow|Disallow):.*$\n?)*)/gmi;
  for (const m of text.matchAll(groupRe)) {
    const agent = m[1].trim();
    const rules = m[2]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join(" ");
    botBlocks.push(`${agent} => ${rules}`);
  }
  botBlocks.sort();

  return { contentSignal, botBlocks };
}

function describe(label: string, p: Policy): string {
  return [`${label}:`, `  ${p.contentSignal || "(no Content-Signal line)"}`]
    .concat(p.botBlocks.map((b) => `  ${b}`))
    .join("\n");
}

const localText = await Deno.readTextFile(LOCAL);

const resp = await fetch(REMOTE, { headers: { Accept: "text/plain" } });
if (!resp.ok) {
  console.error(
    `Could not fetch esolia-2025's robots.txt: HTTP ${resp.status} ${resp.statusText}`,
  );
  console.error(`  ${REMOTE}`);
  Deno.exit(2);
}
const remoteText = await resp.text();

const local = extractPolicy(localText);
const remote = extractPolicy(remoteText);

const problems: string[] = [];

if (!local.contentSignal) problems.push("this repo has no Content-Signal line");
if (!remote.contentSignal) {
  problems.push("esolia-2025 has no Content-Signal line");
}
if (local.contentSignal !== remote.contentSignal) {
  problems.push("the Content-Signal lines differ");
}
if (local.botBlocks.length === 0) problems.push("this repo blocks no AI bots");
if (local.botBlocks.join("\n") !== remote.botBlocks.join("\n")) {
  problems.push("the AI-bot User-agent blocks differ");
}

if (problems.length > 0) {
  console.error("robots.txt policy is out of sync with esolia-2025:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error("");
  console.error(describe("this repo (src/robots.txt)", local));
  console.error("");
  console.error(
    describe("esolia-2025 (live esolia.co.jp/robots.txt)", remote),
  );
  console.error("");
  console.error(
    "Update whichever is stale so both match, then re-run. Disallow lines under\n" +
      "User-agent: * are per-site and are deliberately not compared.",
  );
  Deno.exit(1);
}

console.log("robots.txt policy matches esolia-2025:");
console.log(`  ${local.contentSignal}`);
for (const b of local.botBlocks) console.log(`  ${b}`);
