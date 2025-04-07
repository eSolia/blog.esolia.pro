import lumeCMS from "lume/cms/mod.ts";
import { Field } from "lume/cms/types.ts";

const username = Deno.env.get("ESBLOG_U1")!;
const password = Deno.env.get("ESBLOG_P1")!;

const cms = lumeCMS({
  site: {
    name: "イソリアブログ eSolia Blog",
    description: "Edit the content of the eSolia blog site.",
    url: "https://blog.esolia.pro",
    body: `
    <p>This is the CMS for eSolia's bilingual blog site, with posts in Japanese and English.</p>
    `,
  },
  log: {
    filename: "errors.log",
  },
});

// Enable basicauth
// cms.auth({
//   method: "basic",
//   users: {
//     // foo: "bar",
//     lume: "iscool",
//     [username]: password,
//   },
// });

// Enable basicauth
cms.auth({
  eSolia: "GoodStories!",
});

// Configure upload storage
cms.upload({
  name: "uploads",
  label: "Upload files and images for posts",
  description: "Upload files and images to the uploads folder, for post use",
  store: "src:uploads",
});

cms.upload({
  name: "assets",
  label: "Upload files and images for system",
  description: "Upload files and images to the assets folder, for non-post use",
  store: "src:assets",
});

// Configure git
cms.git();

const url: Field = {
  name: "url",
  type: "text",
  description: "The public URL of the page. Leave empty to use the file path.",
  transform(value) {
    if (!value) {
      return;
    }

    if (!value.endsWith("/")) {
      value += "/";
    }
    if (!value.startsWith("/")) {
      value = "/" + value;
    }

    return value;
  },
};

cms.document({
  name: "featurecats-ja",
  type: "object",
  label: "ブログポストの注目カテゴリ",
  description:
    "良いSEOを確保するために、ブログポストで使われている特別に選択した注目カテゴリ情報を編集する",
  store: "src:_data/featurecats.yml",
  fields: [
    {
      type: "object-list",
      name: "[]",
      label: "カテゴリ",
      description: "注目カテゴリを編集する",
      fields: [
        "key: text",
        "id: text",
        "color: text",
        { name: "image", type: "file", upload: "assets" },
        "summary: markdown",
      ],
    },
  ],
});

cms.document({
  name: "featuretags-ja",
  type: "object",
  label: "ブログポストの注目タグ",
  description:
    "良いSEOを確保するために、ブログポストで使われている特別に選択した注目タグ情報を編集する",
  store: "src:_data/featuretags.yml",
  fields: [
    {
      type: "object-list",
      name: "[]",
      label: "タグ",
      description: "注目タグを編集する",
      fields: [
        "key: text",
        "id: text",
        "summary: markdown",
      ],
    },
  ],
});

cms.document({
  name: "featurecats-en",
  type: "object",
  label: "Blog Post Featured Categories",
  description:
    "To ensure good SEO, edit the information for these specially selected and featured categories, for blog posts",
  store: "src:_data/en/featurecats.yml",
  fields: [
    {
      type: "object-list",
      name: "[]",
      label: "Category",
      description: "Edit Category",
      fields: [
        "key: text",
        "id: text",
        "color: text",
        { name: "image", type: "file", upload: "assets" },
        "summary: markdown",
      ],
    },
  ],
});

cms.document({
  name: "featuretags-en",
  type: "object",
  label: "Blog Post Featured Tags",
  description:
    "To ensure good SEO, edit the information for these specially selected and featured tags, for blog posts",
  store: "src:_data/en/featuretags.yml",
  fields: [
    {
      type: "object-list",
      name: "[]",
      label: "Tag",
      description: "Edit Tag",
      fields: [
        "key: text",
        "id: text",
        "summary: markdown",
      ],
    },
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
  label: "ブログポスト Blog posts",
  description:
    "日本語と英語のブログポストを編集する<br>Edit blog posts in Japanese and English",
  store: "src:posts/*.md",
  documentName(data) {
    return `${
      new Date().toISOString().slice(0, 10).replace(/-/g, "")
    }-${data.title}-${data.lang}.md`;
  },
  fields: [
    {
      name: "draft",
      type: "checkbox",
      label: "ドラフト Draft",
      description: "If checked, the post will not be published.",
      view: "Show Flags",
    },
    {
      name: "hot",
      type: "checkbox",
      label: "ホット Hot",
      description: "If checked, the post will be marked as popular in the UI.",
      view: "Show Flags",
    },
    {
      name: "featured",
      type: "checkbox",
      label: "特集 Featured",
      description:
        "If checked, the post will be included in the featured list in the UI.",
      view: "Show Flags",
    },
    {
      name: "url",
      type: "url",
      label: "URL",
      description:
        "The public URL of the page. Leave empty to use the file path",
      view: "Show Overrides",
    },
    {
      name: "lang",
      type: "select",
      label: "言語 Language",
      description:
        "コンテンツの言語を選択する<br>Select the language of the page content",
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
      attributes: {
        required: true,
      },
    },
    {
      name: "date",
      type: "datetime",
      label: "作成日 Created Date",
      description: "作成された日付<br>The date the page was posted",
      init(field) {
        field.value = new Date().toISOString();
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
        "最終的に更新された日付<br>The date the page was last modified",
      attributes: {
        readonly: true,
      },
    },
    {
      name: "title",
      type: "text",
      label: "ページ・タイトル Page Title",
      description:
        "ページの言語でのタイトル。ブラウザーのタブやページヘッダーに表示され、検索エンジンの結果にも使用されます。<br>Title in the language of the page, visible in browser tab and page header, and used in search engine results",
      attributes: {
        required: true,
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "ページ・ディスクリプション Page Description",
      description:
        "ページの言語でのディスクリプション。ページソース<head>で見えて、検索結果で表示される。<br>Description in the language of the page, visible in page source <head>, and used in search engine results",
      attributes: {
        required: true,
      },
    },
    {
      name: "image",
      type: "file",
      label: "ページ画像 Page Image",
      description:
        "ページの代表画像。ソーシャルメディアで共有する際に表示されます。アップロードして選択するか、デフォルトの画像を使用してください。<br>The image to feature for the page, visible in social media shares. Upload and select, or use the default.",
      value: "/uploads/blog-esolia-pro-default.png",
      uploads: "uploads",
      attributes: {
        accept: "image/*",
      },
    },
    {
      name: "author",
      type: "text",
      label: "コンテンツの著者 Author of the Content",
      description:
        "コンテンツの言語で、署名に表示される著者のフルネーム。<br>The author's full name as it should appear in the byline, in the language of the content",
      init(field, { data }) {
        field.options = data.site?.search.values("author");
      },
    },
    {
      name: "category",
      type: "select",
      label: "カテゴリー Category",
      description:
        "ページのカテゴリ（例：セキュリティ、クラウド など）。ページの言語で入力してください。<br>The page category (e.g. Security, Cloud, etc), in the language of the page",
      init(field, { data }, docData) {
        const site = data.site;
        // Editing an existing document
        if (docData) {
          const { lang } = docData
          if (lang === "ja") {
            const staticCats = [
              "マイクロソフト365",
              "セキュリティ",
              "ネットワーク",
              "クラウド",
              "トラブルシューティング",
              "AI活用",
              "ウィンドウズ",
              "周辺機器",
              "その他",
            ];
            const dynamicCats = site?.search.values(`category lang=${lang}`) || [];
            const allCats = [...staticCats, ...dynamicCats];
            const uniqueCats = [...new Set(allCats)];
            field.options = uniqueCats;
          } else if (lang === "en") {
            const staticCats = [
              "Microsoft-365",
              "Security",
              "Network",
              "Cloud",
              "Troubleshooting",
              "AI-Usage",
              "Windows",
              "Peripherals",
              "Other",
            ];
            const dynamicCats = site?.search.values(`category lang=${lang}`) || [];
            const allCats = [...staticCats, ...dynamicCats];
            const uniqueCats = [...new Set(allCats)];
            field.options = uniqueCats;
          }
        // New document and we do not have the lang yet
        } else {
          const staticCats = [
            "マイクロソフト365",
            "Microsoft-365",
            "セキュリティ",
            "Security",
            "ネットワーク",
            "Network",
            "クラウド",
            "Cloud",
            "トラブルシューティング",
            "Troubleshooting",
            "AI活用",
            "AI-Usage",
            "ウィンドウズ",
            "Windows",
            "周辺機器",
            "Peripherals",
            "その他",
            "Other",
          ];
          const dynamicCats = site?.search.values("category") || [];
          const allCats = [...staticCats, ...dynamicCats];
          const uniqueCats = [...new Set(allCats)];
          field.options = uniqueCats;
        }
      },
    },
    {
      name: "tags",
      type: "list",
      label: "タグ Tags",
      description:
        "ページのタグ。ページの言語で入力してください。<br>The page tags, in the language of the page",
      init(field, { data }) {
        const staticTags = [
          "JIS-Q-27001",
          "ISO-27001",
        ];
        const dynamicTags = data.site?.search.values("tags") || [];
        const allTags = [...staticTags, ...dynamicTags];
        const uniqueTags = [...new Set(allTags)];
        field.options = uniqueTags;
      },
    },
    {
      name: "comments",
      type: "object",
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
        `REPLACE ME. THIS IS THE INTRO TEXT THAT WILL APPEAR ON THE TOP PAGE. ENTER IT BEFORE THE "MORE" TAG JUST BELOW. 

<!--more-->

## STRUCTURE STARTS FROM HEADER 2
REPLACE ME. Enter your content here, using **markdown** formatting of _any kind_.`,
      description:
        "ページの主要なコンテンツ。ページの言語で記述し、Markdown および HTML でフォーマットしてください。<br>The main content of the page, in the language of the page, formatted in markdown and HTML",
      snippets: [
        {
          label: "Figure with Image",
          value: `<figure class="flex flex-col justify-start items-left">
  <img class="shadow-lg rounded-lg" alt="EXPLAIN TO SCREENREADER USER" src="/uploads/blog-esolia-pro-default.png" width="1000px" transform-images="avif webp png jpeg 1000@2">
  <figcaption class="text-left mt-2"><small><em>Fig: ADD YOUR CAPTION HERE</em></small></figcaption>
</figure>`,
        },
        {
          label: "Icon",
          value: `{{- comp.icon({ name: "fire", size: 4, color: "red" }) -}}`,
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
