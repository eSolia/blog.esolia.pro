import { assertEquals } from "jsr:@std/assert@1";
import { parse } from "jsr:@std/yaml@1";

// English post titles use sentence case (eSolia AI-proof editing standard:
// "Sentence case, not Title Case"). Proper nouns keep their capitals, so this
// does not try to recognize them; it looks for the signature of Title Case
// instead: a capitalized function word in mid-title ("Tips For Your PC").
// The first word, and the first word after a colon, question mark or
// exclamation mark, may be capitalized.
const FUNCTION_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "as",
  "is",
  "are",
  "your",
  "you",
  "how",
  "what",
  "when",
  "why",
  "it",
  "its",
  "my",
  "our",
  "this",
  "that",
  "into",
  "without",
  "after",
  "before",
  "up",
  "out",
  "not",
  "be",
  "can",
  "do",
  "does",
]);

export function titleCaseWords(title: string): string[] {
  const offenders: string[] = [];
  const words = title.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    if (/[:?!.]$/.test(words[i - 1])) continue; // a new clause may start capitalized
    const word = words[i].replace(/^[“"'(]+|[”"'),.:;?!]+$/g, "");
    if (/^[A-Z][a-z]+$/.test(word) && FUNCTION_WORDS.has(word.toLowerCase())) {
      offenders.push(word);
    }
  }
  return offenders;
}

Deno.test("titleCaseWords spots Title Case, not proper nouns", () => {
  assertEquals(titleCaseWords("Tips For Your PC"), ["For", "Your"]);
  assertEquals(
    titleCaseWords("Files won't open after moving to SharePoint Online"),
    [],
  );
  assertEquals(
    titleCaseWords("What is Microsoft Copilot? Plans, pricing, and free use"),
    [],
  );
  assertEquals(titleCaseWords("Remote work in 2025: What IT can do"), []);
});

Deno.test("English post titles are in sentence case", async () => {
  const bad: string[] = [];
  for await (const entry of Deno.readDir("src/posts")) {
    if (!entry.name.endsWith(".md")) continue;
    const text = await Deno.readTextFile(`src/posts/${entry.name}`);
    const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1];
    if (!fm) continue;
    const data = parse(fm) as { lang?: string; title?: string };
    if (data.lang !== "en" || typeof data.title !== "string") continue;
    const words = titleCaseWords(data.title);
    if (words.length) {
      bad.push(`${entry.name}: "${data.title}" (${words.join(", ")})`);
    }
  }
  assertEquals(bad, [], "Use sentence case:\n" + bad.join("\n"));
});
