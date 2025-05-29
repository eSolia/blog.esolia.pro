import lume from "lume/mod.ts";

// Load First, order does not matter
import attributes from "lume/plugins/attributes.ts";
import date from "lume/plugins/date.ts";
import { enUS } from "npm:date-fns/locale/en-US";
import { ja } from "npm:date-fns/locale/ja";
import { getGitDate } from "lume/core/utils/date.ts";
import { time } from "node:console";
import { getCurrentVersion } from "lume/core/utils/lume_version.ts";
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
import picture from "lume/plugins/picture.ts";
import transformImages from "lume/plugins/transform_images.ts";

// Markdown
import title from "https://deno.land/x/lume_markdown_plugins@v0.7.1/title.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc.ts";
import image from "https://deno.land/x/lume_markdown_plugins@v0.8.0/image.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.8.0/footnotes.ts";
import { alert } from "npm:@mdit/plugin-alert@0.17.0";

// Utils
import { merge } from "lume/core/utils/object.ts";
import cssBanner from "https://raw.githubusercontent.com/RickCogley/hibana/refs/heads/main/plugins/css_banner.ts?3";
import shuffle from "https://raw.githubusercontent.com/RickCogley/hibana/refs/heads/main/plugins/shuffle.ts?3";

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
},
{ markdown }
);

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
      placeholder: "/* light-theme-here */"
    },
    {
      name: "okaidia",
      cssFile: "styles.css",
      placeholder: "/* dark-theme-here */"
    },
  ]
}));

// CSS + JS + source maps
site.use(esbuild());
site.use(googleFonts({
  subsets: [
    "latin",
    "latin-ext",
    "[2]",
    "[3]",
    "[4]",
    "[5]",
    "[6]",
    "[7]",
    "[8]",
    "[9]",
    "[10]",
    "[11]",
    "[12]",
    "[13]",
    "[14]",
    "[15]",
    "[16]",
    "[17]",
    "[18]",
    "[19]",
    "[20]",
    "[21]",
    "[22]",
    "[23]",
    "[24]",
    "[25]",
    "[26]",
    "[27]",
    "[28]",
    "[29]",
    "[30]",
    "[31]",
    "[32]",
    "[33]",
    "[34]",
    "[35]",
    "[36]",
    "[37]",
    "[38]",
    "[39]",
    "[40]",
    "[41]",
    "[42]",
    "[43]",
    "[44]",
    "[45]",
    "[46]",
    "[47]",
    "[48]",
    "[49]",
    "[50]",
    "[51]",
    "[52]",
    "[53]",
    "[54]",
    "[55]",
    "[56]",
    "[57]",
    "[58]",
    "[59]",
    "[60]",
    "[61]",
    "[62]",
    "[63]",
    "[64]",
    "[65]",
    "[66]",
    "[67]",
    "[68]",
    "[69]",
    "[70]",
    "[71]",
    "[72]",
    "[73]",
    "[74]",
    "[75]",
    "[76]",
    "[77]",
    "[78]",
    "[79]",
    "[80]",
    "[81]",
    "[82]",
    "[83]",
    "[84]",
    "[85]",
    "[86]",
    "[87]",
    "[88]",
    "[89]",
    "[90]",
    "[91]",
    "[92]",
    "[93]",
    "[94]",
    "[95]",
    "[96]",
    "[97]",
    "[98]",
    "[99]",
    "[100]",
    "[101]",
    "[102]",
    "[103]",
    "[104]",
    "[105]",
    "[106]",
    "[107]",
    "[108]",
    "[109]",
    "[110]",
    "[111]",
    "[112]",
    "[113]",
    "[114]",
    "[115]",
    "[116]",
    "[117]",
    "[118]",
    "[119]",
  ],
  cssFile: "styles.css",
  placeholder: "/* lume-google-fonts-here */",
  fonts: {
    textface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@100;200;300;400;500;600;700&display=swap",
  },
}));
site.use(tailwindcss());
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
  output: ["/feed.xml", "/feed.json"],
  query: "type=post",
  info: {
    title: "=metas.site",
    description: "=metas.description",
  },
  items: {
    title: "=title",
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
site.use(minify_html());
site.use(brotli());


site.add([".css"]);
site.add("fonts");
site.add([".js", ".ts"]); // Add the files to bundle
site.add("manifest.json");
site.add("uploads");
site.add("assets");
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

site.process([".html"], (pages) => {
  const siteUrl = new URL("https://blog.esolia.pro"); // Get the base URL of your site

  for (const page of pages) {
    const document = page.document;

    // Select all <a> tags with target="_blank"
    const links = document.querySelectorAll("a[target='_blank']");

    for (const link of links) {
      // --- NEW CHECK ---
      // Check if the link is inside an element with the class 'no-external-icon'
      // The closest() method searches up the DOM tree for the first matching ancestor.
      if (link.closest('.no-external-icon')) {
        // If a matching ancestor is found, skip this link
        continue;
      }
      // --- END NEW CHECK ---

      const href = link.getAttribute("href");

      // Skip if href is missing or is just a fragment link (e.g., #section)
      if (!href || href.startsWith("#")) {
        continue;
      }

      try {
        const linkUrl = new URL(href, site.options.url);

        const isExternal = (linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:') &&
                           (linkUrl.protocol !== siteUrl.protocol ||
                            linkUrl.hostname !== siteUrl.hostname ||
                            linkUrl.port !== siteUrl.port);

        if (isExternal) {
          // Add the class if it's an external link with target="_blank" AND not excluded
          link.classList.add("after:content-['_↗']");
        }

      } catch (e) {
        console.error(`Could not parse URL for link: ${href} on page ${page.src.path}`, e);
      }
    }
  }
});



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
