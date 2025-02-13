# Simple Blog

[Lume](https://lume.land) theme to create a simple blog.

- Supports tags and post authors
- Atom and JSON feeds
- Sitemap and SEO features
- Instant search engine

## Set up a new site

The **fastest and easiest** way to configure this theme is the
[Lume init command](https://deno.land/x/lume_init), which one can also copy
easily from the [Simple Blog theme page](https://lume.land/theme/simple-blog/).
Running:

```bash
deno run -A https://lume.land/init.ts --theme=simple-blog
```

will create a new project with Simple Blog configured. Edit the
[`_data.yml`](./src/_data.yml) file in your blog root folder with your data to
customize the site title, description, and metadata.

Posts must be saved in the `posts` folder. For example,
`posts/my-first-posts.md`.

## Install as a remote theme

To add the theme to an existing Lume project, import it in your `_config.ts`
file as a remote module. Update it by changing the version number in the import
URL:

```ts
import lume from "lume/mod.ts";
import blog from "https://deno.land/x/lume_theme_simple_blog@v0.15.6/mod.ts";

const site = lume();

site.use(blog());

export default site;
```

Copy the [`_data.yml`](./src/_data.yml) file to your blog root folder and edit
it with your data.

## Use it as a base template

To use this theme as a base template for a more customized blog, clone this repo
and edit the [\_config.ts](./_config.ts) file. The source files are in the
[src](./src/) folder.


[![Netlify Status](https://api.netlify.com/api/v1/badges/7bfb45da-9787-468c-bb64-158e43108f49/deploy-status)](https://app.netlify.com/sites/blog-esolia-pro/deploys)

# help.esolia.pro

This doc site is built and based on [lume](https://lume.land/), the static site generator for deno, and is hosted on [Netlify](https://netlify.com) as static files. It's intended to give details about topics that might be too much for eSolia's main marketing sites, such as details about the security of our PROdb cloud database or bulk email error codes. It takes advantage of the i18n feature of lume to generate content pages in English and Japanese. 

Thank you, [Óscar Otero](https://github.com/oscarotero), for lume and all your support on Discord. 🙏🏻

## Mechanics
### Deno-related

Upgrade:

```
> deno task lume upgrade
```

Serve locally:

```
> deno task lume --serve
```

### Markdown
If you set `templateEngine: [vto, md]` in frontmatter, you can use components or call helpers: 

```
{{ comp.callout({
  text: "Lorem ipsum", 
  type: "warning"
  })}}
```

With just the markdown engine you can use "alerts", which come from the alert plugin to markdown-it allowing [github-style alerts](https://github.com/orgs/community/discussions/16925):

```
> [!NOTE]  
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]  
> Crucial information necessary for users to succeed.

> [!WARNING]  
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action.
```
