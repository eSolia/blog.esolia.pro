import lume from "lume/mod.ts";

// Load First, order does not matter
import attributes from "lume/plugins/attributes.ts";
import date from "lume/plugins/date.ts";
import { enUS } from "npm:date-fns/locale/en-US";
import { ja } from "npm:date-fns/locale/ja";
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
import "npm:prismjs@1.29.0/components/prism-git.js";
import "npm:prismjs@1.29.0/components/prism-json.js";
import "npm:prismjs@1.29.0/components/prism-markup.js";
import "npm:prismjs@1.29.0/components/prism-sql.js";
import "npm:prismjs@1.29.0/components/prism-yaml.js";
import "npm:prismjs@1.29.0/components/prism-bash.js";
import "npm:prismjs@1.29.0/components/prism-css.js";
import "npm:prismjs@1.29.0/components/prism-javascript.js";
import "npm:prismjs@1.29.0/components/prism-typescript.js";
import "npm:prismjs@1.29.0/components/prism-powershell.js";
import "npm:prismjs@1.29.0/components/prism-shell-session.js";
import "npm:prismjs@1.29.0/components/prism-json5.js";

// CSS + JS + source maps
import esbuild from "lume/plugins/esbuild.ts";
import googleFonts from "lume/plugins/google_fonts.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
import source_maps from "lume/plugins/source_maps.ts";

// Modify URLs
import basePath from "lume/plugins/base_path.ts";
import resolveUrls from "lume/plugins/resolve_urls.ts";
import checkUrls from "lume/plugins/check_urls.ts";

// Images
import favicon from "lume/plugins/favicon.ts";
import svgo from "lume/plugins/svgo.ts";
import picture from "lume/plugins/picture.ts";
import transformImages from "lume/plugins/transform_images.ts";

// Markdown
import title from "https://deno.land/x/lume_markdown_plugins@v0.7.1/title.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc.ts";
import image from "https://deno.land/x/lume_markdown_plugins@v0.8.0/image.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.8.0/footnotes.ts";
import { alert } from "npm:@mdit/plugin-alert@0.17.0";

// Utils
import { cssBanner, shuffle, deferPagefind, externalLinksIcon } from "https://raw.githubusercontent.com/RickCogley/hibana/v1.0.9/mod.ts";

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
  location: new URL("https://blog.esolia.pro"),
}, { markdown });

// Load First, order does not matter
site.use(attributes());
site.use(date({ locales: { enUS, ja } }));
site.use(jsonLd());
site.use(readingInfo());
site.use(metas());
site.use(multilanguage({
  languages: ["ja", "en"],
  defaultLanguage: "ja",
}));
site.use(nav());
site.use(pagefind({
  ui: {
    containerId: "search",
    showImages: false,
    showEmptyFilters: true,
    resetStyles: false,
    showSubResults: true,
  },
}));
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
site.use(esbuild());
site.use(googleFonts({
  cssFile: "fonts-ja.css",
  fontsFolder: "fonts-ja",
  ignoredSubsets: ["cyrillic", "cyrillic-ext", "vietnamese"],
  fonts: {
    textface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@100;200;300;400;500;600;700&display=swap",
    codeface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400;1,600&display=swap",
  },
}));
site.use(googleFonts({
  cssFile: "fonts-en.css",
  fontsFolder: "fonts-en",
  ignoredSubsets: ["cyrillic", "cyrillic-ext", "vietnamese"],
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
site.use(basePath());
site.use(resolveUrls());
site.use(checkUrls({
  external: true,
}));

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
site.use(picture(/* Options */));
site.use(transformImages({
  cache: true, // Toggle cache
}));

// Markdown
site.use(title());
site.use(toc());
site.use(image());
site.use(footnotes());
site.hooks.addMarkdownItPlugin(alert);

// Utils
site.use(cssBanner({
  message: "===rickcogley - css jokes are always in style===",
}));
site.use(shuffle());

// Assets in HTML
site.use(icons());
site.use(inline());

// Generate files with URLs
site.use(feed({
  output: ["/feed.ja.xml", "/feed.ja.json"],
  query: "type=post lang=ja",
  sort: "date=desc",
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
    title: "=title", // title of the item
    description: "=description", // description
    published: "=date", // publishing date
    updated: "=last_modified", // last update
    lang: "ja", // language
    image: "=image", // image
    authorName: "=author", // author
  },
}));
site.use(feed({
  output: ["/feed.en.xml", "/feed.en.json"],
  query: "type=post lang=en",
  sort: "date=desc",
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
    title: "=title", // title of the item
    description: "=description", // description
    published: "=date", // publishing date
    updated: "=last_modified", // last update
    lang: "en", // language
    image: "=image", // image
    authorName: "=author", // author
  },
}));
site.use(sitemap({
  // query: "external_link=undefined",
  lastmod: "lastmod",
  priority: "priority",
  filename: "sitemap.xml",
  sort: "lastmod=desc",
}));

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
  site.use(minify_html());
  site.use(brotli());
}

site.add([".css"]);
site.add("fonts");
site.add([".js", ".ts"]); // Add the files to bundle
site.add("manifest.json");
site.add("uploads");
site.add("assets");
site.add("f36d0f5824b04fae955f338128bac96e.txt"); // indexnow
// Mastodon comment system
site.add(
  "https://cdn.jsdelivr.net/npm/@oom/mastodon-comments@0.3.2/src/comments.js",
  "/js/comments.js",
);
site.mergeKey("extra_head", "stringArray");

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

site.preprocess([".html"], (pages) => {
  for (const page of pages) {
    const src = page.src.entry?.src;
    if (src) {
      page.data.lastmod = getGitDate("modified", src);
      page.data.created = getGitDate("created", src);
    }
  }
});

site.process([".html"], deferPagefind());
// pass the base url 
site.process([".html"], externalLinksIcon("https://blog.esolia.pro"));

// Define bash script to fix English font URLs
const sedFixFontpathEn = Deno.build.os === "darwin"
  ? "sed -i '' 's|url(\"fonts-en/|url(\"/fonts-en/|g' _site/fonts-en.css"
  : "sed -i 's|url(\"fonts-en/|url(\"/fonts-en/|g' _site/fonts-en.css";

// Define bash script to fix Japanese font URLs
const sedFixFontpathJa = Deno.build.os === "darwin"
  ? "sed -i '' 's|url(\"fonts-ja/|url(\"/fonts-ja/|g' _site/fonts-ja.css"
  : "sed -i 's|url(\"fonts-ja/|url(\"/fonts-ja/|g' _site/fonts-ja.css";

// Register commands
site.script("makeFontpathAbsoluteEn", sedFixFontpathEn);
site.script("makeFontpathAbsoluteJa", sedFixFontpathJa);

// Execute scripts after build
site.addEventListener("afterBuild", "makeFontpathAbsoluteEn");
site.addEventListener("afterBuild", "makeFontpathAbsoluteJa");

// pass the base url 
site.process([".html"], externalLinksIcon("https://blog.esolia.pro"));
site.process([".html"], deferPagefind());

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
