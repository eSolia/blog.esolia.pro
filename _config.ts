import lume from "lume/mod.ts";
import { getCurrentVersion } from "lume/core/utils/lume_version.ts";
import date from "lume/plugins/date.ts";
import { enUS } from "npm:date-fns/locale/en-US";
import { ja } from "npm:date-fns/locale/ja";
import { getGitDate } from "lume/core/utils/date.ts";
import picture from "lume/plugins/picture.ts";
import transformImages from "lume/plugins/transform_images.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
// import lightningCss from "lume/plugins/lightningcss.ts";
import googleFonts from "lume/plugins/google_fonts.ts";
import attributes from "lume/plugins/attributes.ts";
import esbuild from "lume/plugins/esbuild.ts";
// import terser from "lume/plugins/terser.ts";
import prism from "lume/plugins/prism.ts";
import basePath from "lume/plugins/base_path.ts";
// import slugifyUrls from "lume/plugins/slugify_urls.ts";
// import jaconv from "npm:jaconv@1.0.4";
import resolveUrls from "lume/plugins/resolve_urls.ts";
import metas from "lume/plugins/metas.ts";
import nav from "lume/plugins/nav.ts";
import pagefind from "lume/plugins/pagefind.ts";
import sitemap from "lume/plugins/sitemap.ts";
import source_maps from "lume/plugins/source_maps.ts";
// import sri from "lume/plugins/sri.ts";
import favicon from "lume/plugins/favicon.ts";
import feed from "lume/plugins/feed.ts";
import readingInfo from "lume/plugins/reading_info.ts";
import { merge } from "lume/core/utils/object.ts";
import title from "https://deno.land/x/lume_markdown_plugins@v0.7.1/title.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc.ts";
import image from "https://deno.land/x/lume_markdown_plugins@v0.8.0/image.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.8.0/footnotes.ts";
import { alert } from "npm:@mdit/plugin-alert@0.14.0";
import multilanguage from "lume/plugins/multilanguage.ts";
import icons from "lume/plugins/icons.ts";
import brotli from "lume/plugins/brotli.ts";
import cssBanner from "https://raw.githubusercontent.com/RickCogley/hibana/refs/heads/main/plugins/css_banner.ts?3";
import shuffle from "https://raw.githubusercontent.com/RickCogley/hibana/refs/heads/main/plugins/shuffle.ts?3";
import { time } from "node:console";
import inline from "lume/plugins/inline.ts";
import seo from "https://raw.githubusercontent.com/timthepost/cushytext/refs/heads/main/src/_plugins/seo/mod.ts";

// ERRORS: import purgecss from "lume/plugins/purgecss.ts";
// import minify_html from "lume/plugins/minify_html.ts";


const site = lume({
  src: "./src",
  location: new URL("https://blog.esolia.pro"),
});

site.use(googleFonts({
  subsets: ["latin", "latin-ext","[2]","[3]","[4]","[5]","[6]","[7]","[8]","[9]","[10]","[11]","[12]","[13]","[14]","[15]","[16]","[17]","[18]","[19]","[20]","[21]","[22]","[23]","[24]","[25]","[26]","[27]","[28]","[29]","[30]","[31]","[32]","[33]","[34]","[35]","[36]","[37]","[38]","[39]","[40]","[41]","[42]","[43]","[44]","[45]","[46]","[47]","[48]","[49]","[50]","[51]","[52]","[53]","[54]","[55]","[56]","[57]","[58]","[59]","[60]","[61]","[62]","[63]","[64]","[65]","[66]","[67]","[68]","[69]","[70]","[71]","[72]","[73]","[74]","[75]","[76]","[77]","[78]","[79]","[80]","[81]","[82]","[83]","[84]","[85]","[86]","[87]","[88]","[89]","[90]","[91]","[92]","[93]","[94]","[95]","[96]","[97]","[98]","[99]","[100]","[101]","[102]","[103]","[104]","[105]","[106]","[107]","[108]","[109]","[110]","[111]","[112]","[113]","[114]","[115]","[116]","[117]","[118]","[119]"],
  cssFile: "styles.css",
  placeholder: "/* lume-google-fonts-here */",
  fonts: {
    textface:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@100;200;300;400;500;600;700&display=swap",
  },
}));

site.use(attributes());
site.use(picture(/* Options */));
site.use(transformImages());
site.use(tailwindcss());
// site.use(lightningCss());
// site.use(terser());
site.use(prism());
site.use(basePath());
site.use(title());
site.use(toc());
site.use(readingInfo());
site.use(date({ locales: { enUS, ja } }));
site.use(metas());
site.use(image());
site.use(footnotes());
site.use(resolveUrls());
// site.use(slugifyUrls({
//   alphanumeric: false,
//   transliterate: {
//     ja: (text) => jaconv.toHebon(text),
//   }
// }));
site.use(nav());
site.use(pagefind({
  element: "#search",
  resetStyles: false,
}));
site.use(sitemap({
  // query: "external_link=undefined",
  lastmod: "lastmod",
  priority: "priority",
  filename: "sitemap.xml",
  sort: "lastmod=desc",
}));
site.use(source_maps());
// site.use(sri());
site.use(favicon({
  favicons: [
    { 
      url: "/favicon.ico", 
      size: [ 48 ], 
      rel: "icon", 
      format: "ico" 
    },
    {
      url: "/apple-touch-icon.png",
      size: [ 180 ],
      rel: "apple-touch-icon",
      format: "png"
    },
    {
      url: "/android-chrome-192x192.png",
      size: [ 192 ],
      rel: "icon",
      format: "png"
    },
    {
      url: "/android-chrome-512x512.png",
      size: [ 512 ],
      rel: "icon",
      format: "png"
    },
    {
      url: "/favicon-16x16.png",
      size: [ 16 ],
      rel: "icon",
      format: "png"
    },
    {
      url: "/favicon-32x32.png",
      size: [ 32 ],
      rel: "icon",
      format: "png"
    }
  ]
}));
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
site.use(multilanguage({
      languages: ["ja", "en"],
      defaultLanguage: "ja",
}));
site.use(icons());
site.use(brotli());
site.use(cssBanner({
  message: "===rickcogley - css jokes are always in style===",
}));
site.use(shuffle());
// ERRORS: site.use(purgecss()); 
// site.use(minify_html());  
site.use(inline());

site.use(
  seo({
    output: "./_seo_report_en.json",
    ignore: ["/admin/", "/assets/", "/404.html"],
    lengthUnit: "character",
    lengthLocale: "en",
    ignoreAllButLocale: "en",
    thresholdMetaDescriptionLength: 170,
    thresholdContentMinimum: 3500,
    thresholdContentMaximum: 20000,
    thresholdLength: 80,
    thresholdLengthPercentage: 0.7,
    thresholdLengthForCWCheck: 35,
    thresholdCommonWordsPercent: 45,
    logOperations: false
  }),
);
import { japaneseCommonWords } from "https://raw.githubusercontent.com/timthepost/cushytext/refs/heads/main/src/_plugins/seo/japanese_common_words.js";
site.use(
  seo({
    output: "./_seo_report_ja.json",
    ignore: ["/admin/", "/assets/", "/404.html"],
    lengthUnit: "character",
    lengthLocale: "ja",
    ignoreAllButLocale: "ja",
    thresholdMetaDescriptionLength: 170,
    thresholdContentMinimum: 3500,
    thresholdContentMaximum: 20000,
    thresholdLength: 80,
    thresholdLengthPercentage: 0.7,
    thresholdLengthForCWCheck: 35,
    thresholdCommonWordsPercent: 45,
    logOperations: false,
    userCommonWordSet: japaneseCommonWords,
    commonWordPercentageCallback: function (input: string) : number { return(0.99); }
  }),
);

site.add([".css"])
site.add("fonts")
site.add([".js", ".ts"]); // Add the files to bundle
site.use(esbuild());
site.add("manifest.json")
site.add("uploads")
site.add("assets")
// Mastodon comment system
site.add(
  "https://cdn.jsdelivr.net/npm/@oom/mastodon-comments@0.3.2/src/comments.js",
  "/js/comments.js",
);
site.mergeKey("extra_head", "stringArray")

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

// Alert plugin
site.hooks.addMarkdownItPlugin(alert);

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
