/**
 * Wash color selection for generated social cards.
 *
 * The color is chosen to differ from the cards of the posts published just
 * before, not taken from the category. Posts go out to social feeds in date
 * order, and a run of same-colored cards reads as one blur. The team already
 * does this by hand when making a card, picking a color unlike the recent ones;
 * this does it every time.
 *
 * Hand-made cards take part: their wash color is read from the image itself,
 * so a generated card avoids whatever the team picked for the posts around it.
 */

import { create } from "lume/deps/sharp.ts";
import { WASH } from "./card.ts";

/** Colors a generated card may use. Grey is excluded: it is the fallback. */
export const PALETTE = Object.keys(WASH).filter((name) => name !== "zinc");

/** How many preceding posts a new card must not repeat a color from. */
export const AVOID_RECENT = 4;

/** How far back usage is counted, so the palette cycles evenly. */
export const LOOKBACK = PALETTE.length * 2;

/** Hue in degrees, HSV saturation and value, each 0 to 1. */
function hsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max / 255 };
}

function hexHue(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return hsv((n >> 16) & 255, (n >> 8) & 255, n & 255).h;
}

/** Colors told apart by hue alone; slate and zinc are decided before this. */
const HUED = PALETTE.filter((name) => name !== "slate");

/**
 * Which palette color an existing card is, from its dominant color.
 *
 * The team's washes are brighter than the generated ones (they were picked by
 * eye, not for contrast), so matching is by hue rather than exact color. Two
 * cases come first: an unsaturated card is grey, and a dark desaturated blue is
 * slate. Without the slate rule the team's navy cards were read as sky or
 * violet, which are visibly different in a feed.
 */
export async function cardColor(path: string): Promise<string> {
  const { dominant } = await create(await Deno.readFile(path)).stats();
  const { h, s, v } = hsv(dominant.r, dominant.g, dominant.b);
  if (s < 0.15) return "zinc";
  if (v < 0.6 && h >= 200 && h <= 260) return "slate";
  let best = HUED[0];
  let bestDistance = Infinity;
  for (const name of HUED) {
    const distance = Math.abs(((hexHue(WASH[name]) - h + 540) % 360) - 180);
    if (distance < bestDistance) [best, bestDistance] = [name, distance];
  }
  return best;
}

/** Stable small hash, so the same post always breaks ties the same way. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Pick a color for a post, given the colors of the posts before it, most
 * recent last.
 *
 * Never one of the last AVOID_RECENT. Among the rest, the one used least over
 * a longer window, so the palette is cycled rather than two colors alternating.
 * Ties go to a hash of the post id, so the choice is stable between builds.
 */
export function pickColor(id: string, previous: string[]): string {
  const recent = new Set(previous.slice(-AVOID_RECENT));
  const window = previous.slice(-LOOKBACK);
  const candidates = PALETTE.filter((name) => !recent.has(name));
  const pool = candidates.length ? candidates : PALETTE;
  const uses = (name: string) => window.filter((c) => c === name).length;
  const fewest = Math.min(...pool.map(uses));
  const tied = pool.filter((name) => uses(name) === fewest);
  return tied[hash(id) % tied.length];
}
