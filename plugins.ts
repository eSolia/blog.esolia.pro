


import slugifyUrls from "lume/plugins/slugify_urls.ts";
import resolveUrls from "lume/plugins/resolve_urls.ts";
import metas from "lume/plugins/metas.ts";
import pagefind, { Options as PagefindOptions } from "lume/plugins/pagefind.ts";
import sitemap from "lume/plugins/sitemap.ts";
import feed, { Options as FeedOptions } from "lume/plugins/feed.ts";
import readingInfo from "lume/plugins/reading_info.ts";
import { merge } from "lume/core/utils/object.ts";
import title from "https://deno.land/x/lume_markdown_plugins@v0.7.1/title.ts";
import toc from "https://deno.land/x/lume_markdown_plugins@v0.8.0/toc.ts";
import image from "https://deno.land/x/lume_markdown_plugins@v0.8.0/image.ts";
import footnotes from "https://deno.land/x/lume_markdown_plugins@v0.8.0/footnotes.ts";
import { alert } from "npm:@mdit/plugin-alert@0.14.0";
import multilanguage from "lume/plugins/multilanguage.ts";

import "lume/types.ts";

export interface Options {
  prism?: Partial<PrismOptions>;
  date?: Partial<DateOptions>;
  pagefind?: Partial<PagefindOptions>;
  feed?: Partial<FeedOptions>;
  languages?: string[];
  languageNames?: Record<string, string>;
}

export const defaults: Options = {
  feed: {
    output: ["/feed.xml", "/feed.json"],
    query: "type=post",
    info: {
      title: "=metas.site",
      description: "=metas.description",
    },
    items: {
      title: "=title",
    },
  },
};

/** Configure the site */
export default function (userOptions?: Options) {
  const options = merge(defaults, userOptions);

  return (site: Lume.Site) => {
    site.use(lightningCss())
      .use(basePath())
      .use(title())
      .use(toc())
      .use(prism(options.prism))
      .use(readingInfo())
      .use(date(options.date))
      .use(metas())
      .use(image())
      .use(footnotes())
      .use(resolveUrls())
      .use(slugifyUrls())
      .use(terser())
      .use(pagefind(options.pagefind))
      .use(sitemap())
      .use(feed(options.feed))
      .add([".css"])
      .add("fonts")
      .add("js")
      .add("favicon.png")
      .add("uploads")
      .add("assets")
      .mergeKey("extra_head", "stringArray")
      .preprocess([".md"], (pages) => {
        for (const page of pages) {
          page.data.excerpt ??= (page.data.content as string).split(
            /<!--\s*more\s*-->/i,
          )[0];
        }
      });

    // Alert plugin
    site.hooks.addMarkdownItPlugin(alert);

    // Mastodon comment system
    site.add(
      "/js/comments.js",
      "https://cdn.jsdelivr.net/npm/@oom/mastodon-comments@0.3.2/src/comments.js",
    );
  };
}
