import lumeCMS from "lume/cms/mod.ts";
import { Field } from "lume/cms/types.ts";

const cms = lumeCMS({
  site: {
    name: "eSolia Blog",
    description: "Edit the content of the eSolia blog site.",
    url: "https://blog.esolia.pro",
    body: `
    <p>This is the CMS for eSolia's bilingual blog site, with posts in Japanese and English.</p>
    `,
  },
});

// Enable basicauth
cms.auth({
  eSolia: "GoodStories!",
});

// Configure upload
cms.upload("uploads: Uploaded files", "src:uploads");

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

cms.document(
  "settings: Global settings for the site",
  "src:_data.yml",
  [
    {
      name: "lang",
      type: "select",
      label: "Language",
      description: "コンテンツの言語を選択する<br>Select the language of the page content",
      attributes: {
        required: true,
      },
      options: [
        {
          label: "日本語",
          value: "ja"
        },
        {
          label: "English",
          value: "en"
        },
      ],
    },
    {
      name: "home",
      type: "object",
      fields: [
        {
          name: "welcome",
          type: "text",
          label: "Title",
          description: "Welcome message in the homepage",
        },
      ],
    },
    {
      name: "menu_links",
      type: "object-list",
      fields: [
        {
          name: "title",
          type: "text",
          label: "Title",
        },
        {
          name: "url",
          type: "text",
          label: "URL",
        },
      ],
    },
    {
      name: "extra_head",
      type: "code",
      description: "Extra content to include in the <head> tag",
    },
    {
      name: "metas",
      type: "object",
      description: "Meta tags configuration.",
      fields: [
        "site: text",
        "description: text",
        "title: text",
        "image: text",
        "twitter: text",
        "lang: text",
        "generator: checkbox",
      ],
    },
  ],
);

cms.collection(
  "posts: Blog posts in Japanese and English",
  "src:posts/*.md",
  [
    {
      name: "lang",
      type: "select",
      label: "Language",
      description: "コンテンツの言語を選択する<br>Select the language of the page content",
      attributes: {
        required: true,
      },
      options: [
        {
          label: "日本語",
          value: "ja"
        },
        {
          label: "English",
          value: "en"
        },
      ],
    },
    {
      name: "id",
      type: "text",
      label: "Unique ID for a Set of Translated Pages",
      description: "Must be the same string for each language version of the same page, and acts to link them together",
      attributes: {
        required: true,
      },
    },
    "title: text",
    url,
    {
      name: "author",
      type: "text",
      init(field, { data }) {
        field.options = data.site?.search.values("author");
      },
    },
    "date: date",
    {
      name: "draft",
      label: "Draft",
      type: "checkbox",
      description: "If checked, the post will not be published.",
    },
    {
      name: "tags",
      type: "list",
      label: "Tags",
      init(field, { data }) {
        field.options = data.site?.search.values("tags");
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
      name: "extra_head",
      type: "code",
      description: "Extra content to include in the <head> tag",
    },
    {
      name: "content",
      type: "markdown",
      label: "Content",
    },
  ],
);

cms.collection(
  "pages: Additional pages, like about, contact, etc.",
  "src:pages/*.md",
  [
    {
      name: "layout",
      type: "hidden",
      value: "layouts/page.vto",
    },
    {
      name: "title",
      type: "text",
      label: "Title",
    },
    url,
    {
      name: "menu",
      type: "object",
      label: "Whether to include in the menu",
      fields: [
        {
          name: "visible",
          type: "checkbox",
          label: "Show in menu",
        },
        {
          name: "order",
          type: "number",
          label: "Order",
        },
      ],
    },
    {
      name: "extra_head",
      type: "code",
      description: "Extra content to include in the <head> tag",
    },
    {
      name: "content",
      type: "markdown",
      label: "Content",
    },
  ],
);

export default cms;
