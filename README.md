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

#### Who made a CMS edit (git author)

Each CMS save is a git commit. Its author is whoever is signed in to Cloudflare
Access, e.g. `Ena Ishikawa <ena.ishikawa@esolia.co.jp>`. The name comes from
the Authors list when the email is there, otherwise from first.last. The
committer stays the VPS git identity. This records who *entered* the edit; the
article's writer is its byline (Writer dropdown).

The identity comes from Access's signed token, verified in
`scripts/cms/cloudflare_access.ts`. It is switched on only on the VPS, by a
systemd drop-in:

```ini
# /etc/systemd/system/lumecms.service.d/access.conf
[Service]
Environment=CMS_ACCESS_TEAM_DOMAIN=esolia.cloudflareaccess.com
Environment=CMS_ACCESS_AUD=<the Access application's AUD tag>
```

then `systemctl daemon-reload && systemctl restart lumecms`. Without those
variables (local development) the CMS has no login and commits are anonymous.
With them, a request without a valid token is refused (403), so if the Access
application or its AUD tag changes, update the drop-in. To switch it off,
delete the drop-in and restart.

#### Authors

The CMS has an Authors list (`src/_data/authors.yml`), edited like the
featured categories. The post form's Writer field is a dropdown built from it.

- **Byline** is whatever the writer wants shown (initials, first name, full
  name), the same in both languages. It is what a post's `author` field
  stores.
- **Active** only controls who the dropdown offers. Unticking it never changes
  existing posts, and a post by an inactive writer still shows and keeps its
  byline.
- **Former bylines** keep a redirect from a renamed byline's old author page.
  Add the old byline here when renaming, then change the posts.
- Email is first.last@esolia.co.jp, for reference only; it is not published.
- The CMS rewrites the file when the list is saved (and drops comments), so
  keep notes here rather than in the YAML.

#### Social cards

A post with no card of its own (Social Card left at the default, empty, or the
same file as the top image) gets one generated at build time: the top photo
under a color wash, the title in white, and the eSolia mark. The code is in
`scripts/og/`, wired in by a preprocessor in `_config.ts`.

- **Nothing is committed.** The card is rebuilt every build, so changing the
  top image or title updates it.
- **The color rotates.** It is chosen not to repeat any of the four posts
  before it, reading the colors of the team's hand-made cards from the images,
  so consecutive posts in a social feed don't all look the same. Every wash
  holds at least 4.4:1 contrast with the white title.
- **Authors can check it.** In the CMS preview (and branch preview builds) the
  end of each post shows its social card, marked preview only. It is never
  shown on the live site. Drafts are left out of the color history, so the
  preview shows the same card production will build.
- **Hand-made cards win.** Upload to Social Card to use your own card
  instead. In the CMS the image fields run in fill-in order: ① Top Image, ②
  Image Credit, ③ Social Card.

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

### Cloudflare build environment

The production build runs on Cloudflare Workers Builds, and **the Deno version
is hardcoded in the dashboard build command**, not in this repo:

> Workers → `blog-esolia-pro` → Settings → Build → Build command
>
> ```
> curl -fsSL https://deno.land/install.sh | sh -s v2.9.6 && $HOME/.deno/bin/deno task build:cloudflare
> ```

The `sh -s v<version>` argument is the pin. It is recorded here because nothing
in version control reveals it, and because the failure it causes is confusing:
the build installs its own Deno, so a developer machine with a different Deno
builds happily while Cloudflare fails.

Two things that look like they should control this but **do not**: a
`DENO_VERSION` build variable (not one of the build image's supported version
overrides — those are `GO_`, `NODE_`, `PYTHON_`, `RUBY_`, `BUN_`, `HUGO_`,
`YARN_` and `PNPM_VERSION`) and a `.tool-versions` file (not read). Both were
tried. The build command is the only lever.

Note also that `vars` in `wrangler.jsonc` are **runtime** variables for the
Worker and have no effect on the build.

**Lint and format-check are deliberately not part of this build.** They run in
`.github/workflows/checks.yml` instead, against a pinned Deno. They used to run
inside `build:cloudflare`, which meant a formatting nit could block a
production deploy, and — worse — welded the deploy to one Deno version:
`deno fmt` output is not stable across minors, so a repo formatted with 2.8
fails `fmt --check` under 2.9 and vice versa. With the checks moved out, the
build command's version can be changed independently.

To reproduce a build failure locally with a matching Deno:
`dvm install 2.9.6 && ~/.dvm/versions/2.9.6/deno task build:cloudflare`.

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
