// LumeCMS extension: "Copy for translation" / "Paste translation" buttons.
//
// Injected into every CMS page via the `extraHead` option in _cms.ts. On the
// edit page of a post it adds two buttons to the "..." menu:
//
// - Copy for translation: puts a bundle on the clipboard made of a short
//   instruction for the translator plus the post's title, description and
//   content Markdown, each under a section marker. The author pastes it into
//   Claude Team (or any translator).
// - Paste translation: opens a dialog with a textarea. The author pastes the
//   reply and clicks Apply; the three sections are written back into the
//   title, description and content fields. Nothing is saved until the author
//   clicks "Save changes".
//
// Reading the clipboard from a page script is uneven across browsers (Edge and
// Chrome prompt, Safari shows a one-off paste button, Firefox refuses), so the
// paste side uses a textarea, which needs no permission anywhere.

const { baseurls: BASE } = document.documentElement.dataset;
const COLLECTION = "posts";
const MENU_ID = "edit-menu";
const CLASS = "translation-clipboard";
const DIALOG_ID = "modal-paste-translation";

const FIELDS = ["title", "description", "category", "tags", "content"];
const MARKERS = {
  title: "=== TITLE ===",
  description: "=== DESCRIPTION ===",
  category: "=== CATEGORY ===",
  tags: "=== TAGS ===",
  content: "=== CONTENT ===",
};

// Category names are fixed per language (see the category field in _cms.ts).
// Listed in the instructions so the translator returns the exact spelling,
// and used on paste to snap a near miss to the exact option.
const CATEGORY_PAIRS = [
  ["Microsoft-365", "Microsoft-365"],
  ["セキュリティ", "Security"],
  ["ネットワーク", "Network"],
  ["クラウド", "Cloud"],
  ["トラブルシューティング", "Troubleshooting"],
  ["AI活用", "AI-Usage"],
  ["Windows", "Windows"],
  ["周辺機器", "Peripherals"],
  ["その他", "Other"],
];

const INSTRUCTIONS = [
  "Translate the blog post below. If it is in Japanese, translate it into",
  "natural English; if it is in English, translate it into natural Japanese.",
  "Keep all Markdown and HTML formatting, code blocks, URLs, image paths,",
  'attribute blocks such as {target="_blank" rel="noopener"}, the',
  "<!--more--> tag and the five section markers exactly as they are.",
  "CATEGORY must become its counterpart from this list (Japanese = English):",
  CATEGORY_PAIRS.map(([ja, en]) => `${ja} = ${en}`).join(", ") + ".",
  "TAGS are one per line; translate each into a short natural tag.",
  "Do not add commentary. Reply with only the five sections, in this format:",
].join("\n");

const TEXT = {
  copy: "翻訳用にコピー Copy for translation",
  copyTitle:
    "タイトル・説明・カテゴリ・タグ・本文を翻訳指示付きでクリップボードにコピーします。Claude Team などに貼り付けて翻訳してください。\n" +
    "Copies the title, description, category, tags and content with a translation instruction. Paste it into Claude Team (or another translator).",
  copied: "コピーしました Copied for translation",
  copyFallback:
    "クリップボードに書き込めませんでした。下のテキストを全選択してコピーしてください。\n" +
    "Could not write to the clipboard. Select all of the text below and copy it.",
  paste: "翻訳を貼り付け Paste translation",
  pasteTitle:
    "翻訳結果を貼り付けて、タイトル・説明・カテゴリ・タグ・本文に反映します。反映後に内容を確認して保存してください。\n" +
    "Paste the translated reply to fill the title, description, category, tags and content. Review, then Save changes.",
  dialogHeading: "翻訳を貼り付け Paste translation",
  dialogHelp: "Claude の返答をそのまま貼り付けて「反映」を押してください。\n" +
    "Paste the reply exactly as returned, then click Apply.",
  apply: "反映 Apply",
  applied:
    "反映しました。内容を確認して「Save changes」で保存してください。 Applied. Review, then click Save changes.",
  appliedContentOnly:
    "セクション区切りが見つからなかったため、本文のみ反映しました。 No section markers found, so only the content was replaced.",
  empty: "貼り付けたテキストが空です。 The pasted text is empty.",
};

/** True when the edit form belongs to the posts collection. */
function isPostForm(form) {
  const prefix = `${BASE}/collection/${COLLECTION}/`;
  const { pathname } = new URL(form.action, location.href);
  return pathname.startsWith(prefix) && pathname.endsWith("/edit");
}

/**
 * The CMS field component (f-text, f-textarea, f-markdown) for a field name.
 * Inputs are namespaced by the root object ("root.title"), so match both.
 */
function fieldComponent(form, name) {
  const input = form.querySelector(
    `[name="root.${name}"], [name="${name}"]`,
  );
  return input?.closest("f-text, f-textarea, f-markdown") ?? null;
}

function categorySelect(form) {
  return form.querySelector(
    'select[name="root.category"], select[name="category"]',
  );
}

function tagsList(form) {
  return form.querySelector('[name="root.tags.0"], [name="tags.0"]')
    ?.closest("f-list") ?? form.querySelector("f-list");
}

function readFields(form) {
  const values = {};
  for (const name of FIELDS) {
    values[name] = fieldComponent(form, name)?.currentValue ?? "";
  }
  values.category = categorySelect(form)?.value ?? "";
  values.tags = (tagsList(form)?.currentValue ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join("\n");
  return values;
}

/** Snap a translated category to the exact option spelling when possible. */
function normalizeCategory(value) {
  const wanted = value.trim().toLowerCase();
  for (const pair of CATEGORY_PAIRS) {
    const hit = pair.find((name) => name.toLowerCase() === wanted);
    if (hit) {
      return hit;
    }
  }
  return value.trim();
}

function writeCategory(form, value) {
  const select = categorySelect(form);
  if (!select || !value) {
    return;
  }
  const category = normalizeCategory(value);
  const known = Array.from(select.options).some((o) => o.value === category);
  if (!known) {
    select.append(new Option(category, category));
  }
  select.value = category;
}

/**
 * Replace the tag list: remove every row, then use the field's own "add"
 * button so each new row gets the right name, datalist and delete button.
 */
function writeTags(form, value) {
  const list = tagsList(form);
  if (!list) {
    return;
  }
  const tags = value.split("\n").map((t) => t.trim()).filter(Boolean);
  const addButton = list.querySelector("footer.field-footer button");
  if (!addButton) {
    return;
  }
  for (const row of list.querySelectorAll(".fieldset > *")) {
    row.remove();
  }
  for (const tag of tags) {
    addButton.click();
    const inputs = list.querySelectorAll(".fieldset input");
    inputs[inputs.length - 1].value = tag;
  }
}

function writeField(form, name, value) {
  if (name === "category") {
    writeCategory(form, value);
    return;
  }
  if (name === "tags") {
    writeTags(form, value);
    return;
  }
  const component = fieldComponent(form, name);
  if (component) {
    component.update(component.schema, value);
  }
}

function buildBundle(values) {
  const sections = FIELDS.map((name) =>
    `${MARKERS[name]}\n${(values[name] ?? "").trim()}`
  );
  return `${INSTRUCTIONS}\n\n${sections.join("\n\n")}\n`;
}

/** Strip a surrounding ``` code fence, which chat tools sometimes add. */
function stripFence(text) {
  const match = text.trim().match(/^```[^\n]*\n([\s\S]*?)\n```$/);
  return match ? match[1] : text;
}

/**
 * Split a reply into sections. Anything before the first marker (such as
 * "Here is the translation:") is ignored. Returns null when no marker exists.
 */
function parseBundle(text) {
  const cleaned = stripFence(text);
  const found = FIELDS
    .map((name) => ({ name, index: cleaned.indexOf(MARKERS[name]) }))
    .filter((m) => m.index >= 0)
    .sort((a, b) => a.index - b.index);
  if (!found.length) {
    return null;
  }
  const sections = {};
  found.forEach((m, i) => {
    const start = m.index + MARKERS[m.name].length;
    const end = i + 1 < found.length ? found[i + 1].index : cleaned.length;
    sections[m.name] = cleaned.slice(start, end).trim();
  });
  // A fence that opened after a preface line ("Here is the translation:")
  // is not caught by stripFence; drop its closing line from the last section.
  const last = found[found.length - 1].name;
  sections[last] = sections[last].replace(/\n?```[^\n]*$/, "").trim();
  return sections;
}

function toast(text) {
  const div = document.createElement("div");
  div.className = "tooltip is-toast";
  div.textContent = text;
  (document.querySelector("u-form") ?? document.body).append(div);
  setTimeout(() => div.remove(), 4000);
  return div;
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

/** Build (once) the modal used for both pasting and the copy fallback. */
function getDialog() {
  let dialog = document.getElementById(DIALOG_ID);
  if (dialog) {
    return dialog;
  }
  dialog = el("dialog", { className: "modal is-center", id: DIALOG_ID });
  const close = el("button", {
    type: "button",
    className: "buttonIcon modal-close",
    innerHTML: '<u-icon name="x"></u-icon>',
  });
  close.addEventListener("click", () => dialog.close());
  const heading = el("h2", { className: `${CLASS}-heading` });
  heading.style.marginBottom = "0.5em";
  const help = el("p", { className: `${CLASS}-help` });
  help.style.whiteSpace = "pre-line";
  help.style.marginBottom = "0.5em";
  const textarea = el("textarea", {
    className: `input ${CLASS}-textarea`,
    rows: 16,
    spellcheck: false,
  });
  textarea.style.width = "min(70vw, 60em)";
  textarea.style.fontFamily = "monospace";
  const apply = el("button", {
    type: "button",
    className: `button is-primary ${CLASS}-apply`,
  }, TEXT.apply);
  const footer = el("footer", { className: "field-footer" }, apply);
  dialog.append(
    close,
    heading,
    help,
    el("div", { className: "field" }, textarea),
    footer,
  );
  // On <body>, not inside the menu popover: hiding the popover would hide
  // the dialog with it, even though it is in the top layer.
  document.body.append(dialog);
  return dialog;
}

function openDialog(menu, { heading, help, value, applyLabel, onApply }) {
  const dialog = getDialog();
  dialog.querySelector(`.${CLASS}-heading`).textContent = heading;
  dialog.querySelector(`.${CLASS}-help`).textContent = help;
  const textarea = dialog.querySelector(`.${CLASS}-textarea`);
  textarea.value = value;
  const apply = dialog.querySelector(`.${CLASS}-apply`);
  apply.textContent = applyLabel;
  apply.hidden = !onApply;
  apply.onclick = onApply
    ? () => onApply(textarea.value, () => dialog.close())
    : null;
  menu.hidePopover?.();
  dialog.showModal();
  textarea.focus();
  if (!onApply) {
    textarea.select();
  }
}

async function copyForTranslation(form, menu) {
  const bundle = buildBundle(readFields(form));
  try {
    await navigator.clipboard.writeText(bundle);
    menu.hidePopover?.();
    toast(`${TEXT.copied} (${bundle.length})`);
  } catch {
    openDialog(menu, {
      heading: TEXT.copy,
      help: TEXT.copyFallback,
      value: bundle,
      applyLabel: "",
      onApply: null,
    });
  }
}

function pasteTranslation(form, menu) {
  openDialog(menu, {
    heading: TEXT.dialogHeading,
    help: TEXT.dialogHelp,
    value: "",
    applyLabel: TEXT.apply,
    onApply(text, close) {
      if (!text.trim()) {
        toast(TEXT.empty);
        return;
      }
      const sections = parseBundle(text);
      if (sections) {
        for (const [name, value] of Object.entries(sections)) {
          writeField(form, name, value);
        }
        toast(TEXT.applied);
      } else {
        writeField(form, "content", stripFence(text).trim());
        toast(TEXT.appliedContentOnly);
      }
      close();
    },
  });
}

function menuButton(label, title, icon, onClick) {
  const button = el("button", {
    type: "button",
    className: `button is-secondary ${CLASS}`,
    title,
  });
  const u = document.createElement("u-icon");
  u.setAttribute("name", icon);
  button.append(u, ` ${label}`);
  button.addEventListener("click", onClick);
  return button;
}

function install() {
  const form = document.getElementById("form-edit");
  const menu = document.getElementById(MENU_ID);
  if (!form || !menu || menu.querySelector(`.${CLASS}`) || !isPostForm(form)) {
    return;
  }
  // The field components render asynchronously after the form exists, so
  // wait for the content field before adding the buttons.
  if (!fieldComponent(form, "content")) {
    if (!form.dataset.translationClipboardPending) {
      form.dataset.translationClipboardPending = "true";
      const pending = new MutationObserver(() => {
        if (fieldComponent(form, "content")) {
          pending.disconnect();
          delete form.dataset.translationClipboardPending;
          install();
        }
      });
      pending.observe(form, { childList: true, subtree: true });
    }
    return;
  }

  const copy = menuButton(
    TEXT.copy,
    TEXT.copyTitle,
    "clipboard-text",
    () => copyForTranslation(form, menu),
  );
  const paste = menuButton(
    TEXT.paste,
    TEXT.pasteTitle,
    "clipboard",
    () => pasteTranslation(form, menu),
  );

  // After the "Create translation" button when present, otherwise after the
  // built-in Duplicate dialog; either way before Delete.
  const translate = menu.querySelector(".translate-button");
  const duplicate = menu.querySelector('[commandfor="modal-duplicate"]');
  const dialog = duplicate?.nextElementSibling;
  const anchor = translate ??
    (dialog?.matches("dialog") ? dialog : duplicate);
  if (anchor) {
    anchor.after(copy, paste);
  } else {
    menu.append(copy, paste);
  }
}

// The CMS swaps `.app-container` in place on navigation (Navigation API), so
// re-run whenever the body's children change, as well as on first load.
install();
new MutationObserver(install).observe(document.body, { childList: true });
