[![Netlify Status](https://api.netlify.com/api/v1/badges/7bfb45da-9787-468c-bb64-158e43108f49/deploy-status)](https://app.netlify.com/sites/blog-esolia-pro/deploys)

# blog.esolia.pro

This blog site is built and based on [`lume`](https://lume.land/), the "static site generator" for `deno`, and is hosted on [Netlify](https://netlify.com) as static files. In comparison to a database-driven site such as Wordpress, static sites are secure and high-performance.

This site is intended to share blog articles from eSolia Inc, such as: 

* tech tips
* IT stories
* informational articles 
* tutorials
* announcements

It takes advantage of the multilanguage feature of `lume` to generate content pages in English and Japanese. In addition, it has: 

* tags (post keywords) and categories (post type)
* RSS and JSON feeds
* Sitemap and other SEO-related features such as comprehensive metadata
* Instant content search engine
* CMS for easy editing, and you can enter content in markdown or html

Thank you, [Óscar Otero](https://github.com/oscarotero), for lume and all your support on Discord. 🙏🏻

## Mechanics
### CMS

Log into the cms at https://cms.blog.esolia.pro/admin 

If you make changes on a local clone of the repo and push, the cms won't get those automatically as of 2025 Feb. At this time you need to: 

1. ssh to the vps, specifying the private key
2. `cd www`
3. `git pull`
4. `systemctl restart lumecms`

This pulls the changes from origin, and restarts lumecms. It takes 30 seconds for the UI to be refreshed. 

### Deno-related
Install `deno` on your system and clone the repo to serve locally on localhost, for testing.

Serve locally:

```
> deno task lume --serve
```

Upgrade:

```
> deno task lume upgrade
```

### Markdown "alerts"
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

All of these, and other codes you can use in authoring, are in the "Snippets" dropdown in the markdown editor, in the CMS.