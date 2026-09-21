import lumeCMS from "lume/cms/mod.ts";
import { parse as parseYaml } from "lume/deps/yaml.ts";

// Canonical tags, enforced at save time.
//
// src/_data/tagaliases.yml lists every retired tag name and the tag that
// replaced it. The build canonicalises tags too (see _config.ts), but doing it
// here as well means the MARKDOWN FILE is corrected, not just the rendered
// page — otherwise an author who picks a retired name out of the autocomplete
// sees it come back every time they reopen the post.
//
// The two languages are merged into one lookup. That is safe because no
// retired name maps to different canonical tags in Japanese and English;
// `Adobe` and `Acrobat`, the only names appearing in both, resolve to
// `Adobe Acrobat` either way. The CMS field transform does not receive the
// document's language, so a single map is also the only workable shape.
const tagAliasGroups = parseYaml(
  await Deno.readTextFile(
    new URL("./src/_data/tagaliases.yml", import.meta.url),
  ),
) as Record<string, Record<string, string[]>>;

const CANONICAL_TAG = new Map<string, string>();
for (const groups of Object.values(tagAliasGroups ?? {})) {
  for (const [canonical, retired] of Object.entries(groups ?? {})) {
    for (const old of retired ?? []) CANONICAL_TAG.set(old, canonical);
  }
}

// Browser-side extensions for the post editor, inlined into the CMS <head>
// because the admin base path is only known at runtime and the scripts read
// it from the page itself. Module scripts run in document order, after the
// CMS UI, and in the order listed here.
//   translate-button.js      "Create translation" (opposite-language twin)
//   translation-clipboard.js "Copy for translation" / "Paste translation"
const extensions = await Promise.all(
  ["translate-button.js", "translation-clipboard.js"].map((file) =>
    Deno.readTextFile(new URL(`./_cms/${file}`, import.meta.url))
  ),
);

const cms = lumeCMS({
  site: {
    name: "イソリアブログ eSolia Blog",
    description: "Edit the content of the eSolia blog site.",
    url: "https://esolia.co.jp/blog",
    body: `
    <p>This is the CMS for eSolia's bilingual blog site, with posts in Japanese and English.</p>
    `,
  },
  extraHead: extensions
    .map((code) => `<script type="module">${code}</script>`)
    .join("\n"),
});

// Auth is enforced at the edge (Cloudflare Access on cms.blog.esolia.pro), NOT
// in the CMS. Under Lume 3.2 the CMS only runs via `lume --serve`, whose
// `isProduction` gate is always false, so the plugin never applies cms.auth().
// Do not add cms.auth() here expecting it to protect the CMS — it does nothing.

// Configure upload storage
cms.upload({
  name: "uploads",
  icon: "image",
  label: "Upload files and images for posts",
  description: "Upload files and images to the uploads folder, for post use.",
  store: "src:uploads",
});

cms.upload({
  name: "assets",
  icon: "stack",
  label: "Upload files and images for system",
  description:
    "Upload files and images to the assets folder, for non-post use.",
  store: "src:assets",
});

// Configure git
cms.git();

cms.document({
  name: "featurecats-ja",
  icon: "squares-four",
  type: "object-list",
  label: "ブログポストの注目カテゴリ",
  description:
    "良いSEOを確保するために、ブログポストで使われている特別に選択した注目カテゴリ情報を編集する",
  store: "src:_data/featurecats.yml",
  fields: [
    "key: text",
    "id: text",
    {
      name: "color",
      type: "select",
      label: "色 Color",
      description:
        "カテゴリの色（Tailwindの色名）。一覧から選んでください。<br>The category color (a Tailwind color name). Pick from the list.",
      options: [
        "cyan",
        "emerald",
        "esoliaamber",
        "fuchsia",
        "lime",
        "red",
        "sky",
        "teal",
      ],
    },
    { name: "image", type: "file", upload: "assets" },
    "summary: markdown",
  ],
});

cms.document({
  name: "featuretags-ja",
  icon: "tag",
  type: "object-list",
  label: "ブログポストの注目タグ",
  description:
    "良いSEOを確保するために、ブログポストで使われている特別に選択した注目タグ情報を編集する",
  store: "src:_data/featuretags.yml",
  fields: [
    "key: text",
    "id: text",
    "summary: markdown",
  ],
});

cms.document({
  name: "featurecats-en",
  icon: "squares-four",
  type: "object-list",
  label: "Blog Post Featured Categories",
  description:
    "To ensure good SEO, edit the information for these specially selected and featured categories, for blog posts.",
  store: "src:_data/en/featurecats.yml",
  fields: [
    "key: text",
    "id: text",
    {
      name: "color",
      type: "select",
      label: "色 Color",
      description:
        "カテゴリの色（Tailwindの色名）。一覧から選んでください。<br>The category color (a Tailwind color name). Pick from the list.",
      options: [
        "cyan",
        "emerald",
        "esoliaamber",
        "fuchsia",
        "lime",
        "red",
        "sky",
        "teal",
      ],
    },
    { name: "image", type: "file", upload: "assets" },
    "summary: markdown",
  ],
});

cms.document({
  name: "featuretags-en",
  icon: "tag",
  type: "object-list",
  label: "Blog Post Featured Tags",
  description:
    "To ensure good SEO, edit the information for these specially selected and featured tags, for blog posts.",
  store: "src:_data/en/featuretags.yml",
  fields: [
    "key: text",
    "id: text",
    "summary: markdown",
  ],
});

// cms.document(
//   "settings: Global settings for the site",
//   "src:_data.yml",
//   [
//     {
//       name: "lang",
//       type: "select",
//       label: "Language",
//       description: "コンテンツの言語を選択する<br>Select the language of the page content",
//       attributes: {
//         required: true,
//       },
//       options: [
//         {
//           label: "日本語",
//           value: "ja"
//         },
//         {
//           label: "English",
//           value: "en"
//         },
//       ],
//     },
//     {
//       name: "home",
//       type: "object",
//       fields: [
//         {
//           name: "welcome",
//           type: "text",
//           label: "Title",
//           description: "Welcome message in the homepage",
//         },
//       ],
//     },
//     {
//       name: "menu_links",
//       type: "object-list",
//       fields: [
//         {
//           name: "title",
//           type: "text",
//           label: "Title",
//         },
//         {
//           name: "url",
//           type: "text",
//           label: "URL",
//         },
//       ],
//     },
//     {
//       name: "extra_head",
//       type: "code",
//       description: "Extra content to include in the <head> tag",
//     },
//     {
//       name: "metas",
//       type: "object",
//       description: "Meta tags configuration.",
//       fields: [
//         "site: text",
//         "description: text",
//         "title: text",
//         "image: text",
//         "twitter: text",
//         "lang: text",
//         "generator: checkbox",
//       ],
//     },
//   ],
// );

cms.collection({
  name: "posts",
  icon: "newspaper",
  label: "ブログポスト Blog posts",
  description:
    "日本語と英語のブログポストを編集する<br>Edit blog posts in Japanese and English.",
  store: "src:posts/*.md",
  documentName(data) {
    // Ensure title is a string and sanitized
    let sanitizedTitle = "";
    if (typeof data.title === "string") {
      sanitizedTitle = data.title
        .trim() // Remove leading/trailing whitespace
        .toLowerCase() // Convert to lowercase (standard for slugs)
        .replace(/[.,'"\/#!$%\^&\*;:{}=\`~()<>]/g, "") // Remove punctuation
        .replace(/--+/g, "-") // Replace multiple hyphens with a single hyphen
        .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
        .trim(); // One more time just in case
    } else {
      sanitizedTitle = "untitled"; // Fallback if title is not a string}
    }
    // Return date, sanitized title, lang as docname
    return `${
      new Date().toISOString().slice(0, 10).replace(/-/g, "")
    }-${sanitizedTitle}-${data.lang}.md`;
  },
  fields: [
    {
      name: "draft",
      type: "checkbox",
      label: "ドラフト Draft",
      description:
        "チェックすると下書き扱いになり、公開サイトには表示されません。公開の準備ができたらチェックを外してください（日付での予約公開にもチェックを外す必要があります）。<br>If checked, the post is a draft and will not appear on the live site. Uncheck it when ready to publish — also required for date-based scheduling to work.",
      view: "Show Flags",
    },
    {
      name: "hot",
      type: "checkbox",
      label: "ホット Hot",
      description:
        "チェックすると、サイト上で「人気（Hot）」として強調表示されます。<br>If checked, the post is flagged as “hot”/popular in the site UI.",
      view: "Show Flags",
    },
    {
      name: "featured",
      type: "checkbox",
      label: "特集 Featured",
      description:
        "チェックすると、トップページなどの注目記事一覧に含まれます。<br>If checked, the post is included in the featured list on the site.",
      view: "Show Flags",
    },
    {
      name: "url",
      type: "url",
      label: "URL",
      description:
        "公開URLの上書き。通常は空欄のままにして、ファイルパスから自動生成させてください。<br>Override the public URL. Normally leave this empty so it is derived from the file path.",
      view: "Show Overrides",
    },
    {
      name: "oldUrl",
      type: "list",
      label: "転送 Redirect",
      description:
        "変更前のurlや、ショートurl。最初と最後に英数半角スラッシュを忘れず。<br>The page url or urls before they changed, or an url intended to be used as a short url. Ensure there is a forward slash before and after.",
      view: "Show Overrides",
      transform(value) {
        return value?.map((redirect: string) => redirect.trim()); // Trim whitespace
      },
    },
    {
      name: "lang",
      type: "select",
      label: "言語 Language",
      description:
        "コンテンツの言語を選択する<br>Select the language of the page content.",
      attributes: {
        required: true,
      },
      options: [
        {
          label: "日本語",
          value: "ja",
        },
        {
          label: "English",
          value: "en",
        },
      ],
    },
    {
      name: "id",
      type: "text",
      label: "固有ID Unique ID",
      description:
        "翻訳されたコンテンツページのセットをグループ化するための一意の文字列（例：YYYYMMDDHHMM）。同じコンテンツのすべての翻訳で同じ値にする必要があります。自動生成されたものを使用するか、自分で入力してください。<br>A unique string (e.g. YYYYMMDDHHMM) that acts to group a set of translated content pages together. It should be the same for all translations of the same content. Use the autogenerated one, or enter your own.",
      // value: new Date().toISOString().slice(0,10).replace(/-/g,""),
      value: new Date().toISOString().slice(0, 16).replace(/[^0-9]/g, ""),
      transform(value) {
        return value?.trim(); // rem whitespace at ends
      },
      attributes: {
        required: true,
      },
    },
    {
      name: "date",
      type: "datetime",
      label: "作成日 Created Date",
      description:
        "この投稿の公開日です。未来の日付を設定すると予約投稿になり、その日にサイトが自動リビルドされる（毎晩・日本時間）タイミングで公開されます。当日または過去の日付なら次回のリビルドで公開されます。公開するには「ドラフト」のチェックを外してください。この日付は記事に表示され、記事の並び順にも使われます。<br>The date this post is published. Set a future date to schedule it — the post goes live on that day when the site rebuilds (nightly, Japan time). A today/past date publishes at the next rebuild. Make sure “Draft” is unchecked. This date is also shown on the post and controls its sort order.",
      init(field) {
        field.value = new Date();
      },
      attributes: {
        required: true,
      },
    },
    {
      name: "last_modified",
      type: "current-datetime",
      label: "最終更新 Last Modified",
      description:
        "保存するたびに自動で更新されます（編集不可）。<br>Updated automatically each time you save; read-only.",
      view: "Show Meta",
      attributes: {
        readonly: true,
      },
    },
    {
      name: "title",
      type: "text",
      label: "ページ・タイトル Page Title",
      description:
        "ページの言語でのタイトル。ブラウザーのタブやページヘッダーに表示され、検索エンジンの結果にも使用されます。<br>Title in the language of the page, visible in browser tab and page header, and used in search engine results.",
      transform(value) {
        if (typeof value === "string") {
          return value
            .trim() // Remove whitespace at ends
            .replace(/[\/#$%\^\*;{}=\`~<>]/g, "") // Remove punctuation
            .replace(/--+/g, "—") // Replace multiple hyphens with emdash
            .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
            .trim(); // One more time just in case
        }
        return value;
      },
      attributes: {
        required: true,
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "ページ・ディスクリプション Page Description",
      description:
        "検索結果やSNSシェアに表示される要約。ページの言語で、120〜160文字程度を目安に記入してください。<br>A summary shown in search results and social shares. Write it in the page's language; aim for roughly 120–160 characters.",
      attributes: {
        required: true,
      },
    },
    {
      name: "image",
      type: "file",
      label: "ページ画像 Page Image",
      description:
        "SNSでシェアされたときに表示される代表画像（OGP画像／推奨サイズ 1200×630px）。アップロードして選択するか、デフォルトのままでも構いません。<br>The social-share (Open Graph) image for the page — recommended size 1200×630px. Upload and select one, or leave the default.",
      value: "/uploads/blog-esolia-pro-default.png",
      transform(value) {
        return value?.trim(); // rem whitespace at ends
      },
      upload: "uploads",
      attributes: {
        accept: "image/*",
      },
    },
    {
      name: "image_top",
      type: "file",
      label: "トップ画像 Page Top Image",
      description:
        "トップページのグリッドに表示される画像（横長・推奨 1200×630px 前後）。アップロードして選択するか、デフォルトのままでも構いません。<br>The image shown in the top-page grid (landscape, ~1200×630px recommended). Upload and select one, or leave the default.",
      value: "/uploads/blog-esolia-pro-default-top.png",
      transform(value) {
        return value?.trim(); // rem whitespace at ends
      },
      upload: "uploads",
      attributes: {
        accept: "image/*",
      },
    },
    {
      // Photo credit. An object rather than one free-text line so the parts
      // stay machine-readable — the template links the name and the source
      // separately, and a later pass can audit which posts still lack one.
      //
      // Every part is optional by design: an author who only knows the
      // photographer's name can record that much instead of leaving it blank.
      name: "image_credit",
      type: "object",
      label: "画像クレジット Image Credit",
      description:
        "写真の出典。分かる範囲で構いません。名前だけでも記録してください。<br>Where the image came from. Fill in whatever you know — even just a name is better than nothing.",
      fields: [
        {
          name: "name",
          type: "text",
          label: "撮影者 Photographer",
          description:
            "例: Frames For Your Heart<br>e.g. Frames For Your Heart",
        },
        {
          name: "url",
          type: "url",
          label: "撮影者のURL Photographer URL",
          description:
            "撮影者のプロフィールページ。<br>The photographer's profile page.",
        },
        {
          name: "source",
          type: "text",
          label: "提供元 Source",
          description: "例: Unsplash, Pexels<br>e.g. Unsplash, Pexels",
        },
        {
          name: "source_url",
          type: "url",
          label: "画像のURL Image URL",
          description:
            "その画像のページ（提供元サイト内）。<br>The image's own page on the source site.",
        },
      ],
    },
    {
      name: "author",
      type: "text",
      label: "コンテンツの著者 Author of the Content",
      description:
        "コンテンツの言語で、署名に表示される著者のフルネーム。<br>The author's full name as it should appear in the byline, in the language of the content.",
      init(field, { data }) {
        field.options = data.site?.search.values("author");
      },
    },
    {
      name: "category",
      type: "select",
      label: "カテゴリー Category",
      description:
        "ページのカテゴリ（例：セキュリティ、クラウド など）。ページの言語で入力してください。<br>The page category (e.g. Security, Cloud, etc), in the language of the page.",
      // Populated dynamically in init(); 0.15.5 requires options to be present.
      options: [],
      init(field, { data }, docData) {
        const site = data.site;
        let allCats: string[] = [];
        const staticCategoriesByLang: Record<string, string[]> = {
          ja: [
            "Microsoft-365",
            "セキュリティ",
            "ネットワーク",
            "クラウド",
            "トラブルシューティング",
            "AI活用",
            "Windows",
            "周辺機器",
            "その他",
          ],
          en: [
            "Microsoft-365",
            "Security",
            "Network",
            "Cloud",
            "Troubleshooting",
            "AI-Usage",
            "Windows",
            "Peripherals",
            "Other",
          ],
        };
        // Editing an existing document
        if (docData) {
          const { lang } = docData;
          if (lang === "ja" || lang === "en") {
            const staticCats = staticCategoriesByLang[lang] || [];
            const dynamicCats =
              site?.search.values("category", `lang=${lang}`) || [];
            allCats = [...staticCats, ...dynamicCats];
          }
          // If lang is not ja or en for some reason, or for new docs without lang yet
        } else {
          const allStaticCats = Object.values(staticCategoriesByLang).flat();
          const dynamicCats = site?.search.values("category") || [];
          allCats = [...allStaticCats, ...dynamicCats];
        }
        field.options = [...new Set(allCats)]; // Deduplicate categories
      },
    },
    {
      name: "tags",
      type: "list",
      label: "タグ Tags",
      description:
        "ページのタグ。<strong>まず一覧から選んでください。</strong>同じ意味のタグが増えると読者が記事を見つけにくくなります。一覧に無い場合のみ新規作成してください。ページの言語で入力し、先頭の「#」は付けないでください（複数可）。<br><strong>Pick from the list first.</strong> Near-duplicate tags make posts harder to find — the list is the shared vocabulary. Only create a new tag when nothing in the list fits. Use the page's language and no leading “#” (multiple allowed). Retired tag names are corrected automatically on save.",
      transform(value) {
        if (!value) return value;
        const seen = new Set<string>();
        const tags: string[] = [];
        for (const raw of value as string[]) {
          const trimmed = raw.trim();
          if (!trimmed) continue;
          // Rewrite retired names to the tag that replaced them, so a stale
          // pick from the autocomplete cannot resurrect a consolidated tag.
          const canonical = CANONICAL_TAG.get(trimmed) ?? trimmed;
          // Two retired names can collapse onto the same canonical tag.
          if (seen.has(canonical)) continue;
          seen.add(canonical);
          tags.push(canonical);
        }
        return tags;
      },
      init(field, { data }, docData) {
        const site = data.site;
        // console.log("data:", data);
        // console.log("docData:", docData);
        // console.log("site:", site);
        let allTags: string[] = [];
        const staticTagsByLang: Record<string, string[]> = {
          ja: [
            "JIS-Q-27001",
          ],
          en: [
            "ISO-27001",
          ],
          // Add more languages here if needed
        };
        // Editing an existing document
        if (docData) {
          const { lang } = docData;
          // console.log("docData.lang:", lang);
          if (lang === "ja" || lang === "en") {
            const staticTags = staticTagsByLang[lang] || [];
            // console.log("staticTags (editing):", staticTags);
            const dynamicTags = site.search.values("tags", `lang=${lang}`) ||
              [];
            // console.log("dynamicTags (editing):", dynamicTags);
            allTags = [...staticTags, ...dynamicTags];
          }
          // If lang is not ja or en for some reason, or for new docs without lang yet
        } else {
          const allStaticTags = Object.values(staticTagsByLang).flat();
          const dynamicTags = site.search.values("tags") || [];
          allTags = [...allStaticTags, ...dynamicTags];
        }
        field.options = [...new Set(allTags)]; // Deduplicate tags
      },
    },
    {
      name: "comments",
      type: "object",
      label: "コメント Comments",
      description:
        "この記事に対応するSNS投稿へのリンク（任意）。<br>Links to the matching social posts for this article (optional).",
      view: "Show Meta",
      fields: [
        {
          name: "src",
          label: "Link to Mastodon post",
          type: "url",
        },
        {
          name: "bluesky",
          label: "Link to Bluesky post",
          type: "url",
        },
      ],
    },
    {
      name: "content",
      type: "markdown",
      label: "コンテンツ Content",
      value:
        `REPLACE ME. THIS IS THE \"LEDE\" INTRO TEXT THAT WILL ALSO APPEAR ON THE TOP PAGE. ENTER IT HERE, MARKDOWN USE OK, NO LINE BREAKS, AND LEAVE THE MORE TAG INTACT. 

<!--more-->

## STRUCTURE STARTS FROM HEADER 2
REPLACE ME. Enter your content here, using **markdown** formatting of _any kind_. Use the Insert Snippet button to add code snippets, images, tables, icons, etc. You can also use HTML tags if you need to, but at first, try line breaks. Use \<br\> sparingly, as we want to control formatting via css.`,
      description:
        "ページの主要なコンテンツ。ページの言語で記述し、Markdown および HTML でフォーマットしてください。<br>The main content of the page, in the language of the page, formatted in markdown and HTML.",
      snippets: [
        {
          label: "Figure with Image",
          value: `<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="EXPLAIN TO SCREENREADER USER" src="/uploads/blog-esolia-pro-default.png" width="1000px" transform-images="avif webp png jpeg 1000@2">
  <figcaption class="text-left mt-2"><small><em>Fig: ADD YOUR CAPTION HERE</em></small></figcaption>
</figure>

`,
        },
        {
          label: "Secure External Link",
          value:
            `[Link title](https://example.com){target="_blank" rel="noopener"}`,
        },
        {
          label: "TABLE skeleton with needed default classes",
          value: `<table class="not-prose w-full text-sm">
  <caption>
    Table: Caption for good a11y and semantics
  </caption>
  <thead>
    <tr>
      <th>Heading 1</th>
      <th>Heading 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Key A</td>
      <td>Value A</td>
    </tr>
    <tr>
      <td>Key B</td>
      <td>Value B</td>
    </tr>
  </tbody>
</table>

`,
        },
        {
          // No left trim. `{{-` strips whitespace backwards, including the
          // blank line that separates this from the block above it. Vento
          // runs before markdown, so markdown-it never sees that blank line
          // and the icon gets absorbed into the preceding heading, list item
          // or HTML block. The right trim stays: it glues the icon to the
          // text the author types after it. See issue #326.
          label: "Icon",
          value: `{{ comp.icon({ name: "fire", size: 4, color: "red" }) -}}`,
        },
        {
          // Steps go INSIDE the blockquote, each line prefixed with "> ".
          // A bare list after the marker is a CommonMark lazy continuation of
          // the preceding paragraph and renders as literal "1." text, which is
          // exactly the bug this snippet exists to stop authors reproducing.
          label: "HOW TO (Step-by-step procedure)",
          value: `> [!HOWTO]
> 1. {$}
> 2.
> 3.`,
        },
        {
          // Both halves in one insert, because a footnote needs a marker AND a
          // definition, and the editor can only insert at the cursor.
          //
          // The definition does NOT have to sit at the end of the document.
          // markdown-it lifts any "[^n]: ..." line out of the flow and renders
          // it in the notes block at the foot of the page, so keeping it
          // directly under the paragraph it belongs to is both valid and much
          // easier to maintain — the note travels with its paragraph when text
          // gets moved around.
          //
          // Renumber by hand if a footnote is inserted before an existing one:
          // the label is what the reader sees.
          label: "FOOTNOTE (marker + note)",
          value: `[^1]

[^1]: {$}`,
        },
        {
          label: "NOTE (Info highlight)",
          value: `> [!NOTE]
> {$}`,
        },
        {
          label: "TIP (Option for success)",
          value: `> [!TIP]
> {$}`,
        },
        {
          label: "IMPORTANT (Needed for success)",
          value: `> [!IMPORTANT]
> {$}`,
        },
        {
          label: "WARNING (Attention to risk!)",
          value: `> [!WARNING]
> {$}`,
        },
        {
          label: "CAUTION (Possible negative outcome!)",
          value: `> [!CAUTION]
> {$}`,
        },
        {
          label: "Keyboard input",
          value: "<kbd>{$}</kbd>",
        },
        {
          label: "Mark highlight",
          value: "<mark>{$}</mark>",
        },
        {
          label: "More Break",
          value: "<!--more-->",
        },
      ],
    },
  ],
});

// cms.collection(
//   "pages: Additional pages, like about, contact, etc.",
//   "src:pages/*.md",
//   [
//     {
//       name: "layout",
//       type: "hidden",
//       value: "layouts/page.vto",
//     },
//     {
//       name: "title",
//       type: "text",
//       label: "Title",
//     },
//     url,
//     {
//       name: "menu",
//       type: "object",
//       label: "Whether to include in the menu",
//       fields: [
//         {
//           name: "visible",
//           type: "checkbox",
//           label: "Show in menu",
//         },
//         {
//           name: "order",
//           type: "number",
//           label: "Order",
//         },
//       ],
//     },
//     {
//       name: "extra_head",
//       type: "code",
//       description: "Extra content to include in the <head> tag",
//     },
//     {
//       name: "content",
//       type: "markdown",
//       label: "Content",
//     },
//   ],
// );

export default cms;
