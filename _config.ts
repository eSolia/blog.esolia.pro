// Must be first: restores MD5 to crypto.subtle for Lume's favicon/cache hashing
// on Deno 2.8+, which dropped MD5 from the native digest allowlist.
import "./_md5_shim.ts";

import lume from "lume/mod.ts";

// Load First, order does not matter
import attributes from "lume/plugins/attributes.ts";
import date from "lume/plugins/date.ts";
import { enUS } from "npm:date-fns@^4.1.0/locale/en-US";
import { ja } from "npm:date-fns@^4.1.0/locale/ja";
import { getGitDate } from "lume/core/utils/date.ts";
// import { time } from "node:console";
// import { getCurrentVersion } from "lume/core/utils/lume_version.ts";
import jsonLd from "lume/plugins/json_ld.ts";
import readingInfo from "lume/plugins/reading_info.ts";
import metas from "lume/plugins/metas.ts";
import multilanguage from "lume/plugins/multilanguage.ts";
import nav from "lume/plugins/nav.ts";
import pagefind from "lume/plugins/pagefind.ts";
import plaintext from "lume/plugins/plaintext.ts";
import redirects from "lume/plugins/redirects.ts";
import prism from "lume/plugins/prism.ts";
import "npm:prismjs@1.30.0/components/prism-git.js";
import "npm:prismjs@1.30.0/components/prism-json.js";
import "npm:prismjs@1.30.0/components/prism-markup.js";
import "npm:prismjs@1.30.0/components/prism-sql.js";
import "npm:prismjs@1.30.0/components/prism-yaml.js";
import "npm:prismjs@1.30.0/components/prism-bash.js";
import "npm:prismjs@1.30.0/components/prism-css.js";
import "npm:prismjs@1.30.0/components/prism-javascript.js";
import "npm:prismjs@1.30.0/components/prism-typescript.js";
import "npm:prismjs@1.30.0/components/prism-powershell.js";
import "npm:prismjs@1.30.0/components/prism-shell-session.js";
import "npm:prismjs@1.30.0/components/prism-json5.js";

// CSS + JS + source maps
import esbuild from "lume/plugins/esbuild.ts";
import googleFonts from "lume/plugins/google_fonts.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
import source_maps from "lume/plugins/source_maps.ts";

// Modify URLs
import basePath from "lume/plugins/base_path.ts";
import resolveUrls from "lume/plugins/resolve_urls.ts";
// import checkUrls from "lume/plugins/check_urls.ts";

// Images
import favicon from "lume/plugins/favicon.ts";
import svgo from "lume/plugins/svgo.ts";
import picture from "lume/plugins/picture.ts";
import transformImages from "lume/plugins/transform_images.ts";

// Markdown
import title from "https://deno.land/x/lume_markdown_plugins@v0.11.0/title.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.11.0/toc.ts";
import image from "https://deno.land/x/lume_markdown_plugins@v0.11.0/image.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.11.0/footnotes.ts";
import { alert } from "npm:@mdit/plugin-alert@2.0.1";

// Utils
import {
  cssBanner,
  deferPagefind,
  externalLinksIcon,
  shuffle,
} from "hibana/mod.ts";

// Assets in HTML
import icons from "lume/plugins/icons.ts";
import inline from "lume/plugins/inline.ts";

// Generate files with URLs
import feed from "lume/plugins/feed.ts";
import sitemap from "lume/plugins/sitemap.ts";

// Checks
// import seo from "https://raw.githubusercontent.com/timthepost/cushytext/refs/heads/main/src/_plugins/seo/mod.ts";

// Final minification and compression
import minify_html from "lume/plugins/minify_html.ts";
import brotli from "lume/plugins/brotli.ts";

// Change markdown-it configuration

const markdown = {
  options: {
    typographer: true,
    breaks: true,
    xhtmlOut: false,
  },
};

const site = lume({
  src: "./src",
  // The blog is served from esolia.co.jp/blog: esolia-2025's Worker forwards
  // /blog/* over a service binding, stripping the prefix before dispatch. The
  // `/blog` path here is what drives `base_path` (below) to prefix every
  // root-relative URL in the built HTML, and what `metas()` builds canonicals
  // and hreflang from. `_site/` layout is unchanged — the prefix exists only in
  // the emitted URLs. Note `lume -s` overwrites this with http://hostname:port
  // (see core/utils/cli_options.ts), so the CMS preview is unaffected.
  location: new URL("https://esolia.co.jp/blog"),
  server: {
    hostname: "127.0.0.1",
    port: 3000,
  },
}, { markdown });

// When Lume serves the CMS (`lume --serve` with _cms.ts), it sets LUME_CMS=true.
// The CMS rebuilds the whole site on each save-triggered reload, and that ~50-80s
// window is when cms.blog.esolia.pro briefly 502s. Search index, feeds, and the
// sitemap are irrelevant to the editor preview, so skip them under the CMS to
// shrink the rebuild. The production Cloudflare build (no LUME_CMS) still emits
// everything.
const isCms = Deno.env.get("LUME_CMS") === "true";

// Load First, order does not matter
site.use(attributes());
site.use(date({ locales: { enUS, ja } }));
site.use(readingInfo());
site.use(multilanguage({
  languages: ["ja", "en"],
  defaultLanguage: "ja",
}));
site.use(nav());
if (!isCms) {
  site.use(pagefind({
    ui: {
      containerId: "search",
      showImages: false,
      showEmptyFilters: true,
      resetStyles: false,
      showSubResults: true,
    },
  }));
}
site.use(plaintext());
site.use(redirects());
site.use(prism({
  theme: [
    {
      name: "default",
      cssFile: "styles.css",
      placeholder: "/* light-theme-here */",
    },
    {
      name: "okaidia",
      cssFile: "styles.css",
      placeholder: "/* dark-theme-here */",
    },
  ],
}));

// CSS + JS + source maps
site.use(esbuild({
  options: {
    bundle: true,
    splitting: true,
    minify: true,
  },
}));
// The JA font CSS is assembled from TWO calls, because `subsets` and
// `ignoredSubsets` apply per call rather than per family, and the two families
// need opposite treatment. Both write to fonts-ja.css.
//
// Call 1 — the Latin half. IBM Plex Sans (not Plex Sans JP), Latin subset only.
// This is the same face the English side uses, so Latin inside Japanese text —
// product names, "AI", "IT", numerals, the whole site chrome — renders
// identically on both sides instead of being a second typeface.
site.use(googleFonts({
  cssFile: "fonts-ja.css",
  fontsFolder: "fonts-ja",
  subsets: ["latin"],
  fonts: {
    textface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap",
    codeface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400;1,600&display=swap",
  },
}));
// Call 2 — the Japanese half. Noto Sans JP is one of only 8 JA families on
// Google Fonts with a variable axis, so one set of subsets covers every weight
// instead of one set per weight (IBM Plex Sans JP has no variable axis, which
// is why four weights of it cost 6.2MB and 487 files).
//
// Its own Latin/cyrillic/vietnamese subsets are dropped: Plex owns Latin via
// the font stack, so downloading Noto's would be dead weight that never wins.
site.use(googleFonts({
  cssFile: "fonts-ja.css",
  fontsFolder: "fonts-ja",
  ignoredSubsets: ["latin", "latin-ext", "cyrillic", "vietnamese"],
  fonts: {
    jpface:
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&display=swap",
  },
}));
site.use(googleFonts({
  cssFile: "fonts-en.css",
  fontsFolder: "fonts-en",
  ignoredSubsets: [
    "cyrillic",
    "cyrillic-ext",
    "vietnamese",
    "latin-ext",
    "greek",
  ],
  fonts: {
    textface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap",
    codeface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400;1,600&display=swap",
  },
}));
site.use(tailwindcss({
  minify: true,
}));
site.use(source_maps());

// Modify URLs

// googleFonts emits document-relative `url("fonts-xx/…")` in its @font-face
// rules, which resolves against the page using the stylesheet and so breaks on
// any URL below the root. It also creates the stylesheet page from inside its
// own `site.process()`, i.e. after Lume has already fixed the page list for
// extension-filtered processors — so `[".css"]` processors never see it, and
// that includes the one `base_path` installs. Hence the explicit `site.url()`
// here (which yields `/blog/fonts-xx/`) rather than leaving the prefix to
// `base_path`, and hence an unfiltered `site.process` so the page is in scope.
//
// This replaces two `afterBuild` sed scripts. `afterBuild` ran long after
// `base_path`, so their output was an unprefixed `/fonts-xx/…` that 404s
// under /blog. Doing it in-pipeline also drops the hardcoded `_site/` dest and
// the darwin/linux sed divergence.
//
// The optional quote group is not polish: tailwindcss(minify) has already
// stripped the quotes by this point (`url(fonts-ja/…)`), and cssBanner puts
// them back further down the pipeline. Match both forms or this silently
// no-ops — which is what a quotes-only pattern does here.
site.process((pages) => {
  for (const page of pages) {
    if (!/^\/fonts-(?:en|ja)\.css$/.test(page.data.url ?? "")) continue;
    page.text = page.text.replace(
      /url\((["']?)(fonts-(?:en|ja))\//g,
      (_match, quote: string, folder: string) =>
        `url(${quote}${site.url(`/${folder}/`)}`,
    );
  }
});

// picture() and transformImages() MUST run BEFORE basePath(), which is the
// opposite of what lume/plugin-order wants — hence the suppression.
//
// picture records each <img src> and later matches it against every file's
// `outputPath` to tag which images need variants built (plugins/picture.ts,
// `processPictureImages`). base_path rewrites src to /blog/uploads/… but does
// NOT restructure the output, so outputPath stays /uploads/…. In Lume's
// mandated order the two never match: no file is tagged, transformImages
// reports "No images to transform found", no variant is built, and every
// srcset points at files that do not exist. That is broken images on every
// listing page, and it is silent — a warning, not an error.
//
// Running picture first means it sees and matches the unprefixed /uploads/…
// path, the variants get built, and base_path then prefixes both `src` and
// `srcset` afterwards (modify_urls handles srcset and imagesrcset explicitly).
//
// This ordering was equally wrong before the /blog move, but harmless: with no
// path on `location`, base_path was a no-op and left src alone. Giving
// `location` a path is what turned it into a visible bug.
site.use(picture(/* Options */));
site.use(transformImages());

// deno-lint-ignore lume/plugin-order
site.use(basePath());
site.use(resolveUrls());
// site.use(checkUrls({
//   external: true,
// }));

// Images
site.use(favicon({
  favicons: [
    {
      url: "/favicon.ico",
      size: [48],
      rel: "icon",
      format: "ico",
    },
    {
      url: "/apple-touch-icon.png",
      size: [180],
      rel: "apple-touch-icon",
      format: "png",
    },
    {
      url: "/android-chrome-192x192.png",
      size: [192],
      rel: "icon",
      format: "png",
    },
    {
      url: "/android-chrome-512x512.png",
      size: [512],
      rel: "icon",
      format: "png",
    },
    {
      url: "/favicon-16x16.png",
      size: [16],
      rel: "icon",
      format: "png",
    },
    {
      url: "/favicon-32x32.png",
      size: [32],
      rel: "icon",
      format: "png",
    },
  ],
}));
site.use(svgo());

// metas runs after asset plugins (esbuild/fonts/tailwind/images/basePath) so it
// sees final, processed URLs — required ordering per lume/plugin-order (Lume 3.2).
site.use(metas());

// jsonLd must run here for exactly the same reason, and used to run near the
// top of this file, before basePath. base_path does not rewrite the contents of
// a <script type="application/ld+json"> block — modify_urls only touches href,
// src, srcset, imagesrcset and form action — so every structured-data `url` and
// `image` was emitted without the /blog prefix. On a post that meant advertising
// a URL that 301s and an image that 404s, to every consumer of structured data,
// while the og: tags right next to it were correct because metas already ran
// late. Same class of bug as the font CSS, Pagefind and picture ordering.
site.use(jsonLd());

// Re-apply the base path to first-party URLs inside the JSON-LD.
//
// json_ld resolves each URL with `new URL(value, site.url(data.url, true))`.
// The base it passes is correct (…/blog/en/posts/x/), but the values coming
// from `=url` and `=image` are ROOT-relative ("/en/posts/x/"), and a
// root-relative path resolves against the origin and discards the base path.
// Result: structured data advertised https://esolia.co.jp/en/posts/x/ (a 301)
// and an image at /uploads/… (a 404), while the og: tags beside it were right,
// because metas resolves differently. Moving this plugin later does not help —
// the value is wrong before ordering ever comes into it.
//
// Only keys that name a first-party resource are rewritten. `sameAs` is
// deliberately excluded: those are external profile URLs and prefixing them
// would corrupt them.
const JSONLD_FIRST_PARTY_KEYS = new Set([
  "url",
  "image",
  "@id",
  "logo",
  "contentUrl",
  "thumbnailUrl",
]);

site.process([".html"], (pages) => {
  const base = site.url("/"); // "/blog/" in production, "/" under `lume -s`
  if (base === "/") return;
  const origin = site.options.location.origin;
  const unprefixed = `${origin}/`;
  const prefixed = `${origin}${base}`;

  const rewrite = (key: string | undefined, value: unknown): unknown => {
    if (Array.isArray(value)) return value.map((v) => rewrite(key, v));
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map((
          [k, v],
        ) => [k, rewrite(k, v)]),
      );
    }
    if (
      typeof value === "string" && key && JSONLD_FIRST_PARTY_KEYS.has(key) &&
      value.startsWith(unprefixed) && !value.startsWith(prefixed)
    ) {
      return prefixed + value.slice(unprefixed.length);
    }
    return value;
  };

  for (const page of pages) {
    const scripts = page.document?.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    for (const el of scripts ?? []) {
      const raw = el.textContent;
      if (!raw) continue;
      try {
        el.textContent = JSON.stringify(rewrite(undefined, JSON.parse(raw)));
      } catch {
        // Malformed JSON-LD is the json_ld plugin's problem, not ours; leave it
        // untouched rather than replacing it with something worse.
      }
    }
  }
});

// Markdown
site.use(title());
// Pinned to 0.11.0 deliberately — do not bump without reading this.
//
// 0.11.1 switched the heading slugifier to Lume's, whose `alphanumeric: true`
// default strips every non-ASCII character. That collapsed all Japanese
// headings to the collision-counter IDs `h_`, `h_-`, `h_--1` … — meaningless
// as anchors and, worse, ORDER-dependent: inserting one heading renumbered
// every anchor below it, silently breaking links previously shared into the
// page. 0.11.1 also began prefixing any slug not starting with an ASCII
// letter with `h_`, which no slugify option can opt out of.
//
// 0.11.0 still resolves `defaults.slugify` to the plugin's own
// `encodeURIComponent(text.trim().toLowerCase().replace(/\s+/g, "-"))`, which
// is what every existing anchor on this site was built with. Staying here
// keeps all of them byte-identical while still taking the footnote fixes from
// 0.9.0 through 0.11.0.
site.use(toc());
site.use(image());
site.use(footnotes());
// Alert callout titles, localized per page.
//
// The plugin hard-codes the English word from the markup (`> [!NOTE]` renders
// "Note"), so a Japanese post showed an English label. `titleRenderer` gets
// the markdown-it `env`, which Lume populates with the page's data, so the
// label can be resolved from that page's own i18n strings — no second plugin
// registration and no post-processing pass over the built HTML.
//
// The option name is version-sensitive and fails silently when wrong. 0.17.0
// read `titleRender` while its docs said `titleRenderer`; 2.0.1 reads
// `titleRenderer`, matching the docs again. Passing the wrong one does not
// error — the titles just revert to the English defaults. If this is ever
// bumped again, check which name the shipped code actually reads.
interface AlertToken {
  markup: string;
  content: string;
}
interface AlertEnv {
  data?: { page?: { data?: { i18n?: { alert?: Record<string, string> } } } };
}

// `howto` is ours, not a GitHub alert type. It rides on this plugin rather
// than on a new markdown-it container because the plugin already tokenizes
// its body as markdown, so an author writes an ordinary numbered list and
// gets a real <ol> — which is the whole point. Authors were previously
// writing `{{ comp.icon(...) }} How to Operate` followed by a bare list, and
// under CommonMark that list is a lazy continuation of the preceding
// paragraph: it rendered as "<br> 1." literal text, not a list at all.
const ALERT_NAMES = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
  "howto",
];

/** The wrapper class and element differ for `howto`; everything else is a GitHub-style callout. */
function alertKind(tokens: AlertToken[], index: number): string {
  return (tokens[index].markup ?? "").toLowerCase();
}

site.hooks.addMarkdownItPlugin(alert, {
  alertNames: ALERT_NAMES,

  // A procedure is a section of steps, not an aside, so `howto` gets
  // <section> + <ol> rather than the callout <div>. There is no dedicated
  // HTML element for a procedure; <ol> is the semantic part and the plugin
  // produces it from the author's markdown. The <section> is left unnamed on
  // purpose: these repeat many times per page, so giving each one an
  // accessible name would flood a screen reader's landmark and heading lists
  // with identical entries.
  openRenderer(tokens: AlertToken[], index: number): string {
    const kind = alertKind(tokens, index);
    return kind === "howto"
      ? `<section class="howto">`
      : `<div class="markdown-alert markdown-alert-${kind}">`;
  },

  closeRenderer(tokens: AlertToken[], index: number): string {
    return alertKind(tokens, index) === "howto" ? `</section>` : `</div>`;
  },

  titleRenderer(
    tokens: AlertToken[],
    index: number,
    _options: unknown,
    env: AlertEnv | undefined,
  ): string {
    const token = tokens[index];
    const key = alertKind(tokens, index);
    // Fall back to the word the author typed, so an unrecognized or
    // untranslated alert degrades to the English label rather than to empty.
    const label = env?.data?.page?.data?.i18n?.alert?.[key] ??
      token.content ?? key;
    const escaped = label
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const cls = key === "howto" ? "howto-title" : "markdown-alert-title";
    return `<p class="${cls}">${escaped}</p>`;
  },
});

// Utils
site.use(cssBanner({
  message: "===rickcogley - css jokes are always in style===",
}));
site.use(shuffle());

// Assets in HTML
site.use(icons());
site.use(inline());

// Generate files with URLs
if (!isCms) {
  site.use(feed({
    output: ["/feed.ja.xml", "/feed.ja.json"],
    query: "type=post lang=ja",
    sort: "date=desc",
    limit: 0,
    info: {
      title: "=site.title",
      description: "=site.description",
      published: new Date(),
      lang: "ja",
      hubs: undefined,
      generator: true,
      authorName: "=site.author",
    },
    items: {
      title: "=title",
      description: "=description",
      published: "=date",
      updated: "=last_modified",
      lang: "ja",
      image: "=image",
      authorName: "=author",
    },
  }));
  site.use(feed({
    output: ["/feed.en.xml", "/feed.en.json"],
    query: "type=post lang=en",
    sort: "date=desc",
    limit: 0,
    info: {
      title: "=en.site.title",
      description: "=en.site.description",
      published: new Date(),
      lang: "en",
      hubs: undefined,
      generator: true,
      authorName: "=en.site.author",
    },
    items: {
      title: "=title",
      description: "=description",
      published: "=date",
      updated: "=last_modified",
      lang: "en",
      image: "=image",
      authorName: "=author",
    },
  }));

  // Enrich JSON feeds with tags and summary from post metadata
  // (The feed plugin doesn't support custom fields, so we post-process)
  site.process(function enrichFeedJson() {
    // Build lookup of post metadata keyed by full URL
    const postMeta = new Map<
      string,
      { category: string; tags: string[]; description: string }
    >();

    for (const data of site.search.pages("type=post")) {
      const fullUrl = site.url(data.url as string, true);
      postMeta.set(fullUrl, {
        category: (data.category as string) || "",
        tags: (data.tags as string[]) || [],
        description: (data.description as string) || "",
      });
    }

    // Find and enrich JSON feed pages
    for (const page of site.pages) {
      const pageUrl = page.data.url as string;
      if (pageUrl?.endsWith(".json") && pageUrl?.includes("feed")) {
        try {
          const content = page.content as string;
          const feedJson = JSON.parse(content);
          if (feedJson.items) {
            for (const item of feedJson.items) {
              const meta = postMeta.get(item.url);
              if (meta) {
                item.tags = meta.category
                  ? [meta.category, ...meta.tags]
                  : [...meta.tags];
                if (meta.description) {
                  item.summary = meta.description;
                }
              }
            }
            page.content = JSON.stringify(feedJson);
          }
        } catch {
          // Skip pages with non-parseable content
        }
      }
    }
  });
  site.use(sitemap({
    // query: "external_link=undefined",
    filename: "sitemap.xml",
    sort: "lastmod=desc",
    // lastmod/priority moved under `items` in Lume 3.2's sitemap plugin, which
    // now requires a leading `=` to reference a page-data field (a bare string is
    // treated as a literal). `lastmod` is the git-modified date set above.
    items: {
      lastmod: "=lastmod",
      priority: "=priority",
    },
  }));
}

// Checks
// site.use(
//   seo({
//     output: "./_seo_report_en.json",
//     ignore: ["/admin/", "/assets/", "/404.html"],
//     lengthUnit: "character",
//     lengthLocale: "en",
//     ignoreAllButLocale: "en",
//     thresholdMetaDescriptionLength: 170,
//     thresholdContentMinimum: 3500,
//     thresholdContentMaximum: 20000,
//     thresholdLength: 80,
//     thresholdLengthPercentage: 0.7,
//     thresholdLengthForCWCheck: 35,
//     thresholdCommonWordsPercent: 45,
//     logOperations: false,
//   }),
// );
// import { japaneseCommonWords } from "https://raw.githubusercontent.com/timthepost/cushytext/refs/heads/main/src/_plugins/seo/japanese_common_words.js";
// site.use(
//   seo({
//     output: "./_seo_report_ja.json",
//     ignore: ["/admin/", "/assets/", "/404.html"],
//     lengthUnit: "character",
//     lengthLocale: "ja",
//     ignoreAllButLocale: "ja",
//     thresholdMetaDescriptionLength: 170,
//     thresholdContentMinimum: 3500,
//     thresholdContentMaximum: 20000,
//     thresholdLength: 80,
//     thresholdLengthPercentage: 0.7,
//     thresholdLengthForCWCheck: 35,
//     thresholdCommonWordsPercent: 45,
//     logOperations: false,
//     userCommonWordSet: japaneseCommonWords,
//     commonWordPercentageCallback: function (input: string): number {
//       return (0.99);
//     },
//   }),
// );

// Optimize HTML
const isDev = Deno.args.includes("-s");
if (!isDev) {
  site.use(minify_html({
    extensions: [".html"],
    options: {
      keep_spaces_between_attributes: true,
      do_not_minify_doctype: true,
      keep_closing_tags: true,
      keep_html_and_head_opening_tags: true,
    },
  }));
  site.use(brotli());
}

site.add([".css"]);
site.add([".svg"]);
site.add("fonts");
site.add([".js", ".ts"]); // Add the files to bundle
site.add("manifest.json");
site.add("uploads");
site.add("assets");
site.add("f36d0f5824b04fae955f338128bac96e.txt"); // indexnow
// The Content-Signal / AI-bot policy, mirrored from esolia-2025. Lume's
// sitemap plugin appends the Sitemap: line to whatever this file contains.
site.add("robots.txt");
site.add("_headers"); // Cloudflare Workers Static Assets headers config (404 handled via not_found_handling in wrangler.jsonc)
// Mastodon comment system
// site.add(
//   "https://cdn.jsdelivr.net/npm/@oom/mastodon-comments@0.3.2/src/comments.js",
//   "/js/comments.js",
// );
// site.mergeKey("extra_head", "stringArray");

site.ignore("*.DS_Store");
site.ignore("keep-archive");

site.preprocess([".md"], (pages) => {
  const now = new Date();
  for (const page of pages) {
    page.data.excerpt ??= (page.data.content as string).split(
      /<!--\s*more\s*-->/i,
    )[0];
    const elapsedDays = now.getTime() - page.data.date.getTime();
    // save the elapsedDays variable:
    page.data.elapseddays = elapsedDays / (1000 * 3600 * 24);
  }
});

// Future-date gating for scheduled posts.
//
// Lume's built-in draft filter runs at load time, so it cannot act on a post's
// `date`. Instead, right before render we drop any post whose `date` is still
// in the future from the pages array. Removing it here (the same splice pattern
// Lume's own multilanguage plugin uses) keeps it out of the rendered output,
// the search index, the feeds, and the sitemap alike. The daily rebuild cron
// (see wrangler.jsonc) re-runs the build each night, so each scheduled post is
// revealed automatically once its date arrives — no manual step needed.
//
// Future-dated posts are revealed (gate disabled) in three cases:
//   1. LUME_DRAFTS is set — the local dev server and the CMS, so editors can
//      preview scheduled posts before they go live.
//   2. The build is a Cloudflare Workers preview build (WORKERS_CI_BRANCH set
//      to anything other than the production branch), so branch preview URLs
//      show scheduled posts for review. Note this only lifts the future-date
//      gate; genuine `draft: true` posts stay hidden even on preview builds.
// Production builds on the main branch keep the gate on.
//
// InfoSec: no security impact — controls only build-time content visibility.
const productionBranch = "main";
const ciBranch = Deno.env.get("WORKERS_CI_BRANCH");
const isPreviewBuild = ciBranch !== undefined && ciBranch !== productionBranch;
const lumeDrafts = (Deno.env.get("LUME_DRAFTS") ?? "").toLowerCase();
const showScheduledDrafts = lumeDrafts === "true" ||
  lumeDrafts === "1" ||
  isPreviewBuild;
// eSolia and its readers are in Japan (UTC+9). Frontmatter dates are parsed as
// UTC and displayed as their date in UTC (e.g. `2026-09-22 00:00:00` shows as
// Sep 22), so reveal a post from the start of that calendar date in JST — not
// in UTC — by shifting the threshold back 9 hours. Without this, a post dated
// Sep 22 would only un-hide at Sep 22 09:00 JST (00:00 UTC), which the 02:00 JST
// nightly rebuild misses, delaying it a full day. With the shift it goes live at
// the first rebuild on or after Sep 22 00:00 JST.
const REVEAL_TZ_OFFSET_MS = 9 * 60 * 60 * 1000;
if (!showScheduledDrafts) {
  site.addEventListener("beforeRender", ({ pages }) => {
    const now = Date.now();
    for (const page of [...pages]) {
      const date = page.data.date;
      if (
        page.data.type === "post" &&
        date instanceof Date &&
        date.getTime() - REVEAL_TZ_OFFSET_MS > now
      ) {
        pages.splice(pages.indexOf(page), 1);
      }
    }
  });
}

site.preprocess([".html"], (pages) => {
  for (const page of pages) {
    const src = page.src.entry?.src;
    if (src) {
      page.data.lastmod = getGitDate("modified", src);
      page.data.created = getGitDate("created", src);
    }
  }
});

// pass the base url
site.process([".html"], externalLinksIcon(site.options.location.href));
if (!isCms) {
  site.process([".html"], deferPagefind());
  // Pagefind's pagefind-ui.js is shipped as an ES module (it imports a shared
  // ../chunk-*.js and sets window.PagefindUI). Lume's pagefind plugin injects it
  // as a classic <script>, so the browser throws "Cannot use import statement
  // outside a module" and PagefindUI never defines — breaking site search. Load
  // it as a module; the init runs on DOMContentLoaded, which fires after the
  // deferred module executes, so window.PagefindUI is ready in time.
  site.process([".html"], (pages) => {
    for (const page of pages) {
      const script = page.document?.querySelector(
        `script[src="${site.url("/pagefind/pagefind-ui.js")}"]`,
      );
      if (script) script.setAttribute("type", "module");
    }
  });
}

// site.filter("tdate", (value: string | undefined, locale: string, timezone: string) => {
//   if (!value) {
//     return;
//   }
//   const recdZonedDateTime = Temporal.ZonedDateTime.from(value);
//   const formatArgs = [
//     [locale],
//     {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       timeZone: timezone
//     }
//   ];
//   return new Intl.DateTimeFormat(...formatArgs).format(recdZonedDateTime.epochMilliseconds);
// });

// site.filter("tdate0", (value: string | undefined, locale: string, timezone: string) => {
//   if (!value) {
//     return;
//   }
//   const recdZonedDateTime = Temporal.ZonedDateTime.from(value).withTimeZone(timezone);
//   const formatArgs = [
//     locale,
//     {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       timeZone: timezone
//     }
//   ];
//   return new Intl.DateTimeFormat(...formatArgs).format(recdZonedDateTime.toInstant().epochMilliseconds);
// });

// site.filter("tdate", (value: string | undefined, locale: string, timezone: string) => {
//   if (!value) {
//     return;
//   }
//   try {
//     console.log("DATE VALUE: " + value);

//     let instant;
//     if (typeof value === "string" && value.includes("GMT")) {
//       // Manually parse custom date format
//       const dateParts = value.split(" ");
//       const day = dateParts[2];
//       const month = dateParts[1];
//       const year = dateParts[3];
//       const time = dateParts[4];
//       const isoString = `${year}-${month}-${day}T${time}.000Z`;
//       instant = Temporal.Instant.from(isoString);
//     } else {
//       // Parse ISO 8601 date format
//       instant = Temporal.Instant.from(value);
//     }

//     const recdZonedDateTime = instant.toZonedDateTimeISO(timezone);
//     const formatArgs = [
//       locale,
//       {
//         year: "numeric",
//         month: "long",
//         day: "numeric",
//         timeZone: timezone
//       }
//     ];
//     return new Intl.DateTimeFormat(...formatArgs).format(recdZonedDateTime.epochMilliseconds);
//   } catch (error) {
//     console.error("Invalid time value:", error);
//     return "Invalid date";
//   }
// });

export default site;
