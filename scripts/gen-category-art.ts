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

/**
 * The tag style: schematic rather than flowing.
 *
 * Tags deliberately do NOT get the ribbon artwork or a colour. Colour is what
 * marks a category, and categories are the coarse axis that takes precedence —
 * giving tags their own palette would blur exactly the distinction the taxonomy
 * depends on. A different pattern family and a neutral treatment keep tags
 * reading as the finer, second tier.
 *
 * Concentric arcs, a faint measuring grid and a few nodes: closer to the
 * circuit underlay on the home page than to the category ribbons.
 */
function tagArtwork(index: number): string {
  const rand = rng(0x85EBCA6B ^ (index * 374761393));
  const shapes: string[] = [];

  // Faint grid, the ground the rest sits on.
  const cell = 60 + Math.floor(rand() * 70);
  const grid: string[] = [];
  for (let x = 0; x <= WIDTH; x += cell) {
    grid.push(`M ${x} 0 V ${HEIGHT}`);
  }
  for (let y = 0; y <= HEIGHT; y += cell) {
    grid.push(`M 0 ${y} H ${WIDTH}`);
  }
  shapes.push(
    `<path d="${
      grid.join(" ")
    }" fill="none" stroke="rgb(120,120,130)" stroke-width="1" opacity="0.24"/>`,
  );

  // Two or three arc fans, radiating from origins placed off the canvas so only
  // the sweep shows rather than a bullseye.
  const fans = 2 + Math.floor(rand() * 2);
  for (let f = 0; f < fans; f++) {
    const cx = WIDTH * (-0.15 + rand() * 1.3);
    const cy = HEIGHT * (rand() < 0.5 ? -0.5 - rand() : 1.5 + rand());
    const rings = 10 + Math.floor(rand() * 16);
    const gap = 26 + rand() * 48;
    const base = 120 + rand() * 260;
    const tone = 70 + Math.floor(rand() * 45);
    const arcs: string[] = [];
    for (let i = 0; i < rings; i++) {
      const rad = base + i * gap;
      // Full circles; the viewBox crops them into sweeps.
      arcs.push(
        `<circle cx="${r(cx)}" cy="${r(cy)}" r="${
          r(rad)
        }" fill="none" stroke="rgb(${tone},${tone},${
          tone + 10
        })" stroke-width="${(1.4 + rand() * 2.2).toFixed(1)}" opacity="${
          (0.2 + 0.45 * (1 - i / rings)).toFixed(2)
        }"/>`,
      );
    }
    shapes.push(`<g>${arcs.join("")}</g>`);
  }

  // A couple of soft wedges for weight, so the band is not only line work.
  const wedges = 2 + Math.floor(rand() * 2);
  for (let w = 0; w < wedges; w++) {
    const x = WIDTH * rand();
    const width = WIDTH * (0.18 + rand() * 0.35);
    const skew = HEIGHT * (0.3 + rand() * 0.9) * (rand() < 0.5 ? -1 : 1);
    const tone = 125 + Math.floor(rand() * 60);
    shapes.push(
      `<path d="M ${r(x)} ${-50} L ${r(x + width)} ${-50} L ${
        r(x + width + skew)
      } ${HEIGHT + 50} L ${r(x + skew)} ${
        HEIGHT + 50
      } Z" fill="rgb(${tone},${tone},${tone + 6})" opacity="${
        (0.16 + rand() * 0.22).toFixed(2)
      }"/>`,
    );
  }

  // Nodes on the grid, like measurement points.
  for (let i = 0; i < 7; i++) {
    const cx = Math.round((rand() * WIDTH) / cell) * cell;
    const cy = Math.round((rand() * HEIGHT) / cell) * cell;
    const rad = (2.5 + rand() * 5).toFixed(1);
    shapes.push(
      `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="rgb(105,105,115)" opacity="${
        (0.22 + rand() * 0.3).toFixed(2)
      }"/>`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" role="presentation">
<rect width="${WIDTH}" height="${HEIGHT}" fill="rgb(244,244,246)"/>
${shapes.join("\n")}
</svg>
`;
}

/** How many tag designs. 100-odd tags share these, which is fine: decorative. */
export const TAG_POOL = 32;

/** Same quarterly-salted derivation as categories, over the tag's own pool. */
export function tagArtFor(tagName: string, when = new Date()): string {
  const quarter = `${when.getUTCFullYear()}Q${
    Math.floor(when.getUTCMonth() / 3) + 1
  }`;
  let h = 2166136261;
  for (const ch of `tag:${tagName}:${quarter}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619);
  }
  const n = ((h >>> 0) % TAG_POOL) + 1;
  return `${ART_BASE}/tag-${String(n).padStart(2, "0")}.svg`;
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
  let tagTotal = 0;
  for (let i = 1; i <= TAG_POOL; i++) {
    const path = `${OUT_DIR}/tag-${String(i).padStart(2, "0")}.svg`;
    await Deno.writeTextFile(path, tagArtwork(i));
    tagTotal += (await Deno.stat(path)).size;
  }
  console.log(
    `  ${POOL} category designs, ${(total / 1024).toFixed(0)} KB\n` +
      `  ${TAG_POOL} tag designs, ${(tagTotal / 1024).toFixed(0)} KB\n` +
      `  in ${OUT_DIR}`,
  );
}
