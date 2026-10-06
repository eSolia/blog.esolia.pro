import { assertEquals } from "jsr:@std/assert@1";
import { parse } from "jsr:@std/yaml@1";
import { normalizeByline } from "../scripts/byline.ts";

Deno.test("normalizeByline trims and spaces the ampersand", () => {
  assertEquals(normalizeByline("Sachiko Kosuge "), "Sachiko Kosuge");
  assertEquals(normalizeByline("  SK  "), "SK");
  assertEquals(normalizeByline("SK&Shiori"), "SK & Shiori");
  assertEquals(normalizeByline("SK  &   Shiori"), "SK & Shiori");
  assertEquals(normalizeByline("SK & Shiori"), "SK & Shiori");
  assertEquals(normalizeByline("Rick  Cogley"), "Rick Cogley");
  assertEquals(normalizeByline("K.Y."), "K.Y.");
});

// The build and the CMS both normalize, so a stray spelling never reaches a
// page. These catch one committed by hand, so the source stays clean too.
Deno.test("authors.yml bylines are already normalized", async () => {
  const authors = parse(
    await Deno.readTextFile("src/_data/authors.yml"),
  ) as { byline: string }[];
  for (const { byline } of authors) {
    assertEquals(byline, normalizeByline(byline));
  }
});

Deno.test("post bylines are already normalized", async () => {
  for await (const entry of Deno.readDir("src/posts")) {
    if (!entry.name.endsWith(".md")) continue;
    const text = await Deno.readTextFile(`src/posts/${entry.name}`);
    const match = text.match(/^author:[ \t]*(.*)$/m);
    if (!match) continue;
    const raw = match[1];
    const byline = /^(['"]).*\1$/.test(raw) ? raw.slice(1, -1) : raw;
    assertEquals(byline, normalizeByline(byline), entry.name);
  }
});
