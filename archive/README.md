# Archive

Source files that were no longer reachable from the build, moved here on
2026-09-20 rather than deleted, so the work in them stays easy to find.

Nothing in this directory is built. It sits outside `src/`, so Lume never
loads it.

## Why these were dead

**The CSS partials** were imported only by `src/styles.oldcss`. That file is
not a `.css` file, so `site.add([".css"])` never picked it up and Lume never
processed it — it does not appear in `_site/` at all. The live stylesheet,
`src/styles.css`, imports Tailwind, three plugins, and `alerts.css`, and
nothing else.

Verified by probing the built CSS for each file's signature rules before
archiving. All absent:

| Probe | From | Occurrences in built CSS |
| --- | --- | --- |
| `hyphenate-limit-chars` | `typography.css` | 0 |
| `font-title-spacing` | `page.css` | 0 |
| `aa-color` | `typography.css` | 0 |
| `1ex / 0.42` | `typography.css` | 0 |

**The templates and layouts** had no reference anywhere in the repo — no
`include`, no `layout:` key, no data reference. Several are earlier drafts
superseded by a sibling: `top-nav1.vto` and `top-nav2.vto` by `top-nav.vto`,
`footer2.vto` by `footer.vto`, `base-old.vto` by `base.vto`, `post1.vto` by
`post.vto`, `top-post-list.vto` and `top-post-list3.vto` by `post-list.vto`.

**`_components/icon.vto`** was never referenced. The `icon()` used throughout
the templates is the filter from `lume/plugins/icons.ts`, which is unrelated.
No Lume component is used anywhere in this site.

## What was deliberately NOT archived

`src/generators/*.page.js` look unreferenced to a grep, because Lume
auto-discovers `*.page.js` by filename rather than importing it. They are
live — they generate `/archive/` and `/en/archive/`. Confirmed by checking
that those pages exist in `_site/` before touching anything.

## Verification

The build was compared before and after the move: **2754 files both times, and
an identical combined hash across every generated HTML page** — `60a55b08…`.
Removing these files changed nothing in the output, which is the evidence that
they were dead.

One wrinkle worth knowing if you repeat this: a naive hash of the built HTML
does **not** work as a comparator here. `src/_data.ts` stamps a fresh
`cacheBuster` timestamp into every build, so two builds of byte-identical
source produce different hashes. The comparison above strips `?cb=<digits>`
before hashing. Without that step the method silently reports a difference
every time and tells you nothing.

## One file was archived by mistake, and the build caught it

`_components/icon.vto` was moved here in the first pass and had to be put
back. The audit searched for each file's **name** — which is correct for
templates (`include "templates/x.vto"`), layouts (`layout: layouts/x.vto`) and
stylesheets (`@import "css/x.css"`), since those all reference by path. Lume
components do not: they are referenced as `comp.icon({ … })`, which contains
the component's name and never its filename, so a filename search cannot find
them.

The build failed loudly — `Component "icon" not found`, 71 fewer pages — which
is itself the useful part: removing something live is not a silent failure
here. It is used by two posts, `20250410-admin-asked-ai-about-the-it-terminology-en.md`
and its Japanese counterpart.

## The typography files are worth reading before rewriting

`typography.css` holds a careful English hyphenation setup —
`hyphenate-limit-chars`, `-lines`, `-last`, `-zone` — that was simply never
wired in. If a typography layer gets written, start from that rather than from
scratch.

Two defects to fix if any of it is revived rather than rewritten:

- `@supports (font-size-adjust: 1;)` — the `;` inside the parentheses makes
  the condition invalid, so that block would never apply even once imported.
- The trailing `html { … }` rule hardcodes `background: rgb(255, 255, 255)`
  with a computed near-black text colour and no dark-mode branch, so it would
  fight the dark theme at the root element.

Japanese had only `hyphens: none`. Anything new should also consider
`line-break` for kinsoku shori, `font-feature-settings: "palt"` for
proportional kana spacing, `text-spacing-trim` for CJK punctuation, and
`overflow-wrap` for long URLs.

## Splide carousel (added 2026-09-20)

`slider1.vto` and `splide-skyblue.min.css` were the markup and theme for a
Splide carousel on the two index pages. Both index pages still referenced the
template, but only from inside a Vento comment (`{{# ... #}}`), so it never
rendered; the stylesheet's `@import` in `styles.css` was likewise commented
out. The class names appear in **0** built pages.

Kept rather than deleted because the markup is a working reference if a
carousel is wanted again — though see issue #191, which proposes a CSS-only
carousel instead of reintroducing the dependency.
