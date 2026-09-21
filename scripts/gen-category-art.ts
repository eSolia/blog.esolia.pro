/**
 * Generates the abstract greyscale artwork used as the hero band on category
 * pages.
 *
 * Why generated SVG rather than the AI-generated JPEGs it replaces: those were
 * square (mostly 1024x1024, one only 300x300), and a hero band needs a wide
 * image. Cropping a square to 3:1 leaves roughly 1024x340 of real pixels, which
 * is 1x at the content width and visibly soft on a retina display. SVG has no
 * resolution to be wrong — the same file is crisp on any screen — and each one
 * weighs a few KB rather than a few hundred.
 *
 * This writes a POOL of numbered designs rather than one per category. Adding a
 * category is then two choices in the CMS — a colour and an image — with no
 * asset work and nothing to generate. The pool is deliberately larger than the
 * current category count so there is room to grow.
 *
 * The artwork is monochrome on purpose. Category colour is applied over the top
 * in CSS from the same plain `color` value the CMS already collects, so one
 * visual language covers every category.
 *
 * Run: deno run -A scripts/gen-category-art.ts
 */

const WIDTH = 2400;
const HEIGHT = 800;
const OUT_DIR = "src/assets/category-art";

/**
 * How many designs to produce. Exported because the category page generator
 * picks from this pool and the two must agree — a mismatch would silently point
 * at an image that does not exist.
 */
export const POOL = 24;

/** Where the pool is served from, for whoever is choosing a file. */
export const ART_BASE = "/assets/category-art";

/**
 * Which design a category gets: derived from its id, reshuffled each quarter.
 *
 * Deriving it means a new category needs no image decision — pick a colour and
 * the artwork assigns itself. Folding the quarter in means the whole site
 * changes its look four times a year without anyone doing anything, while every
 * build inside a quarter stays byte-identical, which a per-build random pick
 * would have destroyed.
 */
export function artFor(categoryId: string, when = new Date()): string {
  const quarter = `${when.getUTCFullYear()}Q${
    Math.floor(when.getUTCMonth() / 3) + 1
  }`;
  let h = 2166136261;
  for (const ch of `${categoryId}:${quarter}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  const n = ((h >>> 0) % POOL) + 1;
  return `${ART_BASE}/art-${String(n).padStart(2, "0")}.svg`;
}

/**
 * Deterministic PRNG (mulberry32). The same index must always produce the same
 * artwork, or every run would churn the files and the git history with visually
 * identical noise.
 */
function rng(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Point {
  x: number;
  y: number;
}

/** A sinuous run of points across the full width, overshooting both edges. */
function spine(
  rand: () => number,
  baseY: number,
  amp: number,
  segments: number,
): Point[] {
  const step = (WIDTH + 400) / segments;
  const phase = rand() * Math.PI * 2;
  const pts: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    // Sine for a continuous sweep, plus noise so the runs are not all the same
    // shape at different offsets.
    const wobble = (rand() - 0.5) * amp * 0.7;
    pts.push({
      x: -200 + i * step,
      y: baseY + Math.sin(phase + i * 1.35) * amp + wobble,
    });
  }
  return pts;
}

/** One decimal is well below a pixel at this size and roughly halves the file. */
const r = (n: number) => Math.round(n * 10) / 10;

/** Smooth cubic path through the points, optionally walked backwards. */
function cubic(pts: Point[], dy = 0, reverse = false): string {
  const p = reverse ? [...pts].reverse() : pts;
  const d: string[] = [`${reverse ? "L" : "M"} ${r(p[0].x)} ${r(p[0].y + dy)}`];
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const cx = (b.x - a.x) * 0.45;
    d.push(
      `C ${r(a.x + cx)} ${r(a.y + dy)}, ${r(b.x - cx)} ${r(b.y + dy)}, ${
        r(b.x)
      } ${r(b.y + dy)}`,
    );
  }
  return d.join(" ");
}

function artwork(index: number): string {
  const rand = rng(0x9E3779B9 ^ (index * 2654435761));

  const defs: string[] = [];
  const shapes: string[] = [];

  // Filled ribbons: the soft masses that give the band weight. Thin and
  // numerous rather than few and thick — a handful of fat bands just stack into
  // horizontal haze and lose all sense of flow.
  const ribbons = 6 + Math.floor(rand() * 4);
  for (let i = 0; i < ribbons; i++) {
    const id = `g${index}_${i}`;
    // Mid-greys only. Pure black would fight the colour tint applied in CSS,
    // and pure white would vanish into the page background.
    const light = 175 + Math.floor(rand() * 55);
    const dark = 95 + Math.floor(rand() * 60);
    const angle = Math.floor(rand() * 180);
    defs.push(
      `<linearGradient id="${id}" gradientTransform="rotate(${angle} 0.5 0.5)">` +
        `<stop offset="0%" stop-color="rgb(${light},${light},${light})"/>` +
        `<stop offset="100%" stop-color="rgb(${dark},${dark},${dark})"/>` +
        `</linearGradient>`,
    );

    const pts = spine(
      rand,
      HEIGHT * (-0.05 + rand() * 1.1),
      HEIGHT * (0.16 + rand() * 0.34),
      4 + Math.floor(rand() * 4),
    );
    const thickness = HEIGHT * (0.07 + rand() * 0.22);

    // Out along the spine and back along the same spine pushed down. The return
    // pass must be walked in reverse or the shape self-crosses, which shows up
    // as hard diagonal wedges across the artwork.
    shapes.push(
      `<path d="${cubic(pts)} ${
        cubic(pts, thickness, true)
      } Z" fill="url(#${id})" opacity="${(0.16 + rand() * 0.24).toFixed(2)}"/>`,
    );
  }

  // Contour groups: nested parallel lines following one curve. These are what
  // read as deliberate drawing rather than fog, and they stay legible once the
  // colour tint goes over the top.
  const groups = 2 + Math.floor(rand() * 3);
  for (let g = 0; g < groups; g++) {
    const pts = spine(
      rand,
      HEIGHT * (0.05 + rand() * 0.9),
      HEIGHT * (0.1 + rand() * 0.28),
      4 + Math.floor(rand() * 4),
    );
    const lines = 7 + Math.floor(rand() * 10);
    const gap = 6 + rand() * 13;
    const tone = 95 + Math.floor(rand() * 55);
    const paths: string[] = [];
    for (let i = 0; i < lines; i++) {
      // Fade from the middle outwards so a group reads as one object.
      const t = 1 - Math.abs(i - lines / 2) / (lines / 2);
      paths.push(
        `<path d="${
          cubic(pts, (i - lines / 2) * gap)
        }" fill="none" stroke="rgb(${tone},${tone},${
          tone + 8
        })" stroke-width="${(1 + rand() * 1.4).toFixed(1)}" opacity="${
          (0.12 + 0.34 * t).toFixed(2)
        }"/>`,
      );
    }
    shapes.push(`<g>${paths.join("")}</g>`);
  }

  // A few specks, echoing the dots in the original artwork.
  for (let i = 0; i < 4; i++) {
    shapes.push(
      `<circle cx="${(rand() * WIDTH).toFixed(0)}" cy="${
        (rand() * HEIGHT).toFixed(0)
      }" r="${(3 + rand() * 8).toFixed(1)}" fill="rgb(110,110,118)" opacity="${
        (0.2 + rand() * 0.25).toFixed(2)
      }"/>`,
    );
  }

  // Light blur only. Enough to soften the overlaps, not enough to dissolve the
  // contour lines — that was what made the first attempt read as grey fog.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" role="presentation">
<defs>
${defs.join("\n")}
<filter id="soft${index}" x="-8%" y="-8%" width="116%" height="116%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="rgb(246,246,247)"/>
<g filter="url(#soft${index})">
${shapes.join("\n")}
</g>
</svg>
`;
}

if (import.meta.main) {
  await Deno.mkdir(OUT_DIR, { recursive: true });
  let total = 0;
  for (let i = 1; i <= POOL; i++) {
    const name = `art-${String(i).padStart(2, "0")}.svg`;
    const path = `${OUT_DIR}/${name}`;
    await Deno.writeTextFile(path, artwork(i));
    total += (await Deno.stat(path)).size;
  }
  console.log(
    `  ${POOL} designs in ${OUT_DIR}, ${(total / 1024).toFixed(0)} KB total`,
  );
}
