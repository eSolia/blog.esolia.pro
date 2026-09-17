# blog.esolia.pro

This blog site is built and based on [`lume`](https://lume.land/), the "static
site generator" for `deno`, and is hosted on
[Cloudflare Workers](https://workers.cloudflare.com/) (Static Assets) as
static files. In comparison to a database-driven site such as Wordpress, static
sites are secure and high-performance.

This site is intended to share blog articles from eSolia Inc, such as:

- tech tips
- IT stories
- informational articles
- tutorials
- announcements

It takes advantage of the multilanguage feature of `lume` to generate content
pages in English and Japanese. In addition, it has:

- tags (post keywords) and categories (post type)
- RSS and JSON feeds
- Sitemap and other SEO-related features such as comprehensive metadata
- Instant content search engine
- CMS for easy editing, and you can enter content in markdown or html

Thank you, [Óscar Otero](https://github.com/oscarotero), for lume and all your
support on Discord. 🙏🏻

## Mechanics

### CMS

Log into the cms at https://cms.blog.esolia.pro/admin

If you make changes on a local clone of the repo and push, the cms won't get
those automatically as of 2025 Feb. At this time you need to:

1. ssh to the vps, specifying the private key
2. `cd www`
3. `git pull`
4. `systemctl restart lumecms`

This pulls the changes from origin, and restarts lumecms. It takes 30 seconds
for the UI to be refreshed.

#### Create translation button

On a post's edit page, the "..." menu has a "Create English version" /
"Create Japanese version" button. It duplicates the current post as its twin in the other
language: same `id` (so the two are linked), `lang` flipped, `draft` on, file
name suffix swapped (`-ja.md` to `-en.md` or back). The URL override, redirect
list and social comment links are not copied. Save the post first; the copy is
made from the form as shown. If the twin file already exists, the button refuses
and links to it. The implementation is `_cms/translate-button.js`, inlined into
the CMS pages via the `extraHead` option in `_cms.ts`.

#### Copy for translation / Paste translation

The same menu has two clipboard buttons for translating with Claude Team (no
API usage):

1. **Copy for translation** copies a bundle: a translation
   instruction plus the title, description, category, tags and content
   Markdown, each under a `=== SECTION ===` marker. Paste it into Claude Team.
2. **Paste translation** opens a dialog. Paste Claude's reply
   as returned and click Apply: the sections are written back into the fields
   (category snapped to the fixed per-language list, tags one per line). A
   reply without markers replaces the content only. Nothing is saved until you
   click Save changes.

Typical flow: finish the post, save, Create translation, Copy for translation,
translate in Claude Team, Paste translation, review, save. Implementation:
`_cms/translation-clipboard.js`.

### Deno-related

Install `deno` on your system and clone the repo to serve locally on localhost,
for testing.

Serve locally:

```
> deno task lume --serve
```

Upgrade:

```
> deno task lume upgrade
```

### Markdown "alerts"

With just the markdown engine you can use "alerts", which come from the alert
plugin to markdown-it allowing
[github-style alerts](https://github.com/orgs/community/discussions/16925):

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

All of these, and other codes you can use in authoring, are in the "Snippets"
dropdown in the markdown editor, in the CMS.

Get info re current branch for pasting:

```
git log --format="%H%nAuthor: %an <%ae>%nDate:   %ad%n%n%s%n%b%n%n" origin/main..HEAD |pbcopy
```
