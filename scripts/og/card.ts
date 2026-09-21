/**
 * Social (Open Graph) card generation for posts that have no hand-made card.
 *
 * A card is the post's photo under a color wash, with the title in white and
 * the eSolia mark bottom-right, the same design as the ~90 cards the team made
 * by hand. It is generated at build time, never committed:
 *
 * - It cannot go stale. It is rebuilt from the current photo and title on
 *   every build, so editing either updates the card with nobody doing anything.
 * - CMS edits are drafted on a branch and published by fast-forward, and
 *   non-production branches build a preview, so an author sees the card before
 *   publishing.
 * - A committed card would need a bot commit on main (bypassing the PR trail)
 *   or a PR per edit that waits on a human merge while the post is live
 *   without its card.
 *
 * Posts with their own card keep it. Only a post whose `image` is missing, or
 * is the same file as `image_top`, gets one generated. The wash color is
 * chosen in palette.ts.
 *
 * Rendering follows esolia-2025's scripts/generate-og-images.mts: Satori for
 * layout, resvg + sharp for the raster. Both are Lume dependencies already, so
 * nothing new is added to the build.
 */

import satori from "lume/deps/satori.ts";
import { create } from "lume/deps/sharp.ts";

export const WIDTH = 1200;
export const HEIGHT = 630;

/**
 * Wash colors.
 *
 * Each is the first Tailwind shade that holds at least 4.5:1 against white
 * text. The team's hand-picked washes are brighter, but several of those fail
 * contrast; a generated card is held to the standard. The titles are large
 * bold text, where 3:1 is the WCAG threshold, so 4.5:1 leaves margin for the
 * photo showing through. `esoliaamber` reaches 4.4:1 only at its 800 step,
 * still well clear of 3:1.
 */
export const WASH: Record<string, string> = {
  cyan: "#0e7490",
  fuchsia: "#c026d3",
  lime: "#4d7c0f",
  emerald: "#047857",
  red: "#dc2626",
  sky: "#0369a1",
  teal: "#0f766e",
  violet: "#7c3aed",
  amber: "#b45309",
  esoliaamber: "#ac6900",
  slate: "#475569",
  zinc: "#52525b",
};

/** Heavy, to match the hand-made cards: the photo is texture, not subject. */
const WASH_OPACITY = 0.84;

const FONT_URL = new URL("./fonts/IBMPlexSansJP-Bold.ttf", import.meta.url);
const MARK_URL = new URL(
  "../../src/assets/symbol_white_bgtransparent.svg",
  import.meta.url,
);

let fontData: ArrayBuffer | undefined;
let markDataUri: string | undefined;

async function assets() {
  if (!fontData) {
    const bytes = await Deno.readFile(FONT_URL);
    fontData = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
  }
  if (!markDataUri) {
    markDataUri = `data:image/svg+xml;base64,${
      toBase64(await Deno.readFile(MARK_URL))
    }`;
  }
  return { fontData, markDataUri };
}

/**
 * Base64 in chunks. Spreading a whole photo into String.fromCharCode(...) blows
 * the call stack once the buffer passes a few hundred KB.
 */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const NBSP = " ";

/**
 * Bind " + " with no-break spaces so a key combination such as "Win + V" never
 * splits across lines; an early hand-made card did exactly that.
 */
function bindKeys(title: string): string {
  return title.replaceAll(" + ", `${NBSP}+${NBSP}`);
}

/** Font size for Latin titles, by length; Satori wraps and balances them. */
export function titleSize(title: string): number {
  const length = [...title].length;
  if (length <= 28) return 76;
  if (length <= 44) return 68;
  if (length <= 62) return 60;
  if (length <= 84) return 52;
  return 44;
}

const CJK = /[\u3000-\u9fff\uff00-\uffef]/;
const STARTS_HIRAGANA = /^[\u3041-\u309f\u30fc]/;
const KATAKANA_ONLY = /^[\u30a0-\u30ff]+$/;
const ENDS_KATAKANA = /[\u30a0-\u30ff]$/;
const OPENING = /^[「『（(［【〈《“]+$/;
/** One kanji, perhaps with its kana ending: 方, 時に, 向け. */
const ONE_KANJI = /^[\u4e00-\u9fff][\u3041-\u309f]{0,2}$/;
const ENDS_KANJI = /[\u4e00-\u9fff]$/;
/** One-kanji suffixes, which may follow kana: 働き方, 使い分け時. */
const SUFFIX = /^[方時用性化的中後前上下内外法者型式版]$/;
/** One-kanji prefixes, which belong with the word after: 再起動, 新機能. */
const PREFIX = /^[再新各全非未超無不旧]$/;
const STARTS_LATIN = /^[A-Za-z0-9]/;
const ENDS_LATIN = /[A-Za-z0-9.]\s?$/;

/**
 * Split a Japanese title into chunks that must not be broken.
 *
 * Satori breaks Japanese between any two characters, and there is no
 * invisible break character to steer it: U+2060 and U+200B both render as
 * missing-glyph boxes in IBM Plex. So Japanese titles are laid out here, line
 * by line, with these chunks as the units.
 *
 * The rule is the usual one for headlines: never break before hiragana, so
 * particles and endings stay with their word (とき|の, 思っ|たら). A break is
 * allowed only where a new word starts in kanji, katakana, Latin or an opening
 * bracket, and even then not inside a compound: a katakana word following
 * katakana (クリップ|ボード), a one-kanji suffix (働き|方, 発生|時に), a
 * one-kanji prefix (再|起動), or a run of Latin words (Windows 11).
 */
export function jaChunks(title: string): string[] {
  const segmenter = new Intl.Segmenter("ja", { granularity: "word" });
  const chunks: string[] = [];
  let carry = "";
  for (const { segment, isWordLike } of segmenter.segment(bindKeys(title))) {
    if (OPENING.test(segment) || PREFIX.test(segment)) {
      carry += segment;
      continue;
    }
    const previous = chunks.at(-1);
    const joins = previous !== undefined && !carry && (
      !isWordLike ||
      STARTS_HIRAGANA.test(segment) ||
      segment.startsWith(NBSP) || previous.endsWith(NBSP) ||
      (KATAKANA_ONLY.test(segment) && ENDS_KATAKANA.test(previous)) ||
      (ONE_KANJI.test(segment) && ENDS_KANJI.test(previous)) ||
      SUFFIX.test(segment) ||
      (STARTS_LATIN.test(segment) && ENDS_LATIN.test(previous))
    );
    if (joins) chunks[chunks.length - 1] += segment;
    else chunks.push(carry + segment);
    carry = "";
  }
  if (carry) chunks.push(carry);
  // Spaces are kept inside chunks, since they separate Latin words; they are
  // trimmed from the ends of lines instead.
  return chunks.filter((chunk) => chunk.trim());
}

/**
 * Width in em. Plex JP sets kana, kanji and full-width forms at exactly 1em;
 * the Latin figures are averages for the bold weight, and only need to be
 * close because lines are kept well inside the text box.
 */
function widthEm(text: string): number {
  let width = 0;
  for (const ch of text) {
    if (CJK.test(ch)) width += 1;
    else if (ch === " " || ch === NBSP) width += 0.25;
    else if (/[A-Z0-9]/.test(ch)) width += 0.64;
    else width += 0.54;
  }
  return width;
}

function tidy(chunks: string[]): string {
  return chunks.join("").replace(/ {2,}/g, " ").trim();
}

/**
 * Split chunks into `lines` lines, making the longest as short as possible, so
 * the lines come out even rather than one full line and a stub.
 */
function balance(chunks: string[], lines: number): string[] {
  const n = chunks.length;
  const widths = chunks.map(widthEm);
  const span = (i: number, j: number) =>
    widths.slice(i, j).reduce((a, b) => a + b, 0);
  // best[k][i]: the smallest possible longest line, setting chunks i.. on k
  // lines; cut[k][i]: where the first of those lines ends.
  const best: number[][] = [];
  const cut: number[][] = [];
  for (let k = 1; k <= lines; k++) {
    best[k] = [];
    cut[k] = [];
    for (let i = 0; i < n; i++) {
      best[k][i] = k === 1 ? span(i, n) : Infinity;
      for (let j = i + 1; k > 1 && j <= n - (k - 1); j++) {
        const worst = Math.max(span(i, j), best[k - 1][j]);
        if (worst < best[k][i]) [best[k][i], cut[k][i]] = [worst, j];
      }
    }
  }
  const result: string[] = [];
  let i = 0;
  for (let k = lines; k > 1; k--) {
    const j = cut[k][i];
    result.push(tidy(chunks.slice(i, j)));
    i = j;
  }
  result.push(tidy(chunks.slice(i)));
  return result;
}

const TEXT_WIDTH = 1000;
/** Line length used for layout: the text box less a margin for estimates. */
const MEASURE = TEXT_WIDTH - 60;
const SIZES = [76, 68, 60, 52, 44];

/**
 * Lay out a Japanese title: the largest size at which it fits on three lines
 * (the hand-made cards rarely use more), balanced across however many lines
 * that size needs.
 */
export function jaLayout(title: string): { size: number; lines: string[] } {
  const chunks = jaChunks(title);
  for (const size of SIZES) {
    const maxEm = MEASURE / size;
    // A chunk wider than the line cannot be set at this size at all.
    if (chunks.some((chunk) => widthEm(chunk.trim()) > maxEm)) continue;
    let lines = 1;
    let used = 0;
    for (const chunk of chunks) {
      const w = widthEm(chunk);
      if (used && used + w > maxEm) {
        lines++;
        used = w;
      } else used += w;
    }
    if (lines <= 3) {
      return { size, lines: balance(chunks, lines) };
    }
  }
  // Too long for three lines even at the smallest size: set it there anyway,
  // on as many lines as it takes.
  const size = SIZES.at(-1)!;
  const maxEm = MEASURE / size;
  const total = chunks.reduce((sum, chunk) => sum + widthEm(chunk), 0);
  return {
    size,
    lines: balance(chunks, Math.min(chunks.length, Math.ceil(total / maxEm))),
  };
}

export interface CardInput {
  /** Filesystem path to the post's photo (its `image_top`). */
  photoPath: string;
  title: string;
  lang: string;
  /** A WASH key. */
  color?: string;
}

/**
 * Render a card to JPEG bytes. JPEG rather than PNG because the card is mostly
 * photo: the PNG of the first test card was 860 KB, several times the size of
 * the hand-made ones.
 */
export async function renderCard(input: CardInput): Promise<Uint8Array> {
  const { fontData, markDataUri } = await assets();

  const photo = await create(await Deno.readFile(input.photoPath))
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82 })
    .toBuffer();
  const photoDataUri = `data:image/jpeg;base64,${
    toBase64(new Uint8Array(photo))
  }`;

  const wash = WASH[input.color ?? ""] ?? WASH.zinc;
  const fill = {
    position: "absolute",
    top: 0,
    left: 0,
    width: WIDTH,
    height: HEIGHT,
  };
  // maxWidth, not width: with balanced wrapping Satori narrows the lines but
  // leaves a fixed-width box pinned left, so short titles sat off-center.
  const titleStyle = {
    maxWidth: TEXT_WIDTH,
    marginTop: -22,
    color: "white",
    fontWeight: 700,
    lineHeight: 1.22,
    textAlign: "center",
  };

  // Latin titles are wrapped and balanced by Satori; Japanese ones arrive as
  // explicit lines from jaLayout (see jaChunks for why).
  const ja = input.lang === "ja" ? jaLayout(input.title) : undefined;
  const title = ja
    ? {
      type: "div",
      props: {
        style: {
          ...titleStyle,
          fontSize: ja.size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        },
        children: ja.lines.map((line) => ({
          type: "div",
          props: { children: line },
        })),
      },
    }
    : {
      type: "div",
      props: {
        style: {
          ...titleStyle,
          fontSize: titleSize(input.title),
          textWrap: "balance",
        },
        children: bindKeys(input.title),
      },
    };

  const tree = {
    type: "div",
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        position: "relative",
        backgroundColor: wash,
        fontFamily: "Plex",
      },
      children: [
        {
          type: "img",
          props: {
            src: photoDataUri,
            width: WIDTH,
            height: HEIGHT,
            style: { ...fill, objectFit: "cover" },
          },
        },
        {
          type: "div",
          props: {
            style: { ...fill, backgroundColor: hexToRgba(wash, WASH_OPACITY) },
          },
        },
        {
          type: "div",
          props: {
            style: {
              ...fill,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            children: title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              right: 78,
              bottom: 62,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: 0.72,
            },
            children: [
              {
                type: "img",
                props: { src: markDataUri, width: 66, height: 66 },
              },
              {
                type: "div",
                props: {
                  style: {
                    color: "white",
                    fontSize: 34,
                    fontWeight: 700,
                    marginTop: 2,
                  },
                  children: "eSolia",
                },
              },
            ],
          },
        },
      ],
    },
  };

  // Satori is typed for React elements; this tree is the plain-object form it
  // accepts at runtime, so it is cast through `unknown` rather than `any`.
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: "Plex", data: fontData, weight: 700, style: "normal" }],
  });

  return new Uint8Array(
    await create(svg).jpeg({ quality: 86, mozjpeg: true }).toBuffer(),
  );
}
