import { assertEquals } from "jsr:@std/assert@1";

// The Content-Signal policy is declared twice: in robots.txt, for crawlers
// that read it, and as a response header in _headers, because Cloudflare's
// Markdown for Agents adds its own default (ai-train=yes) to markdown
// responses unless the origin sends one. The two must say the same thing.
function signal(text: string, pattern: RegExp): string | undefined {
  return text.split("\n").map((line) => line.match(pattern)?.[1]?.trim())
    .find((value) => value !== undefined);
}

Deno.test("_headers Content-Signal matches robots.txt", async () => {
  const robots = await Deno.readTextFile("src/robots.txt");
  const headers = await Deno.readTextFile("src/_headers");
  const fromRobots = signal(robots, /^Content-Signal:\s*(.+)$/i);
  const fromHeaders = signal(headers, /^\s+Content-Signal:\s*(.+)$/i);
  assertEquals(typeof fromRobots, "string", "robots.txt has no Content-Signal");
  assertEquals(fromHeaders, fromRobots);
});
