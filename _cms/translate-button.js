// LumeCMS extension: "Create translation" button for blog posts.
//
// Injected into every CMS page via the `extraHead` option in _cms.ts. On the
// edit page of a post it adds a button to the "..." menu that duplicates the
// current post as its opposite-language twin: same `id` (so the multilanguage
// plugin links the pair), `lang` flipped, `draft` on, file name suffix swapped.
//
// It reuses the CMS's own duplicate route, exactly like the built-in
// "Duplicate" dialog does (see u-form-join.js in LumeCMS): the edit form is
// submitted to `/collection/posts/<file>/duplicate` with a few extra hidden
// inputs. Because the server reads the form with Object.fromEntries(), the
// last value wins, so appending `lang` and `draft` overrides the fields above.

const { baseurls: BASE } = document.documentElement.dataset;
const COLLECTION = "posts";
const LANG_SUFFIX = /[-_](ja|en)\.md$/;
const MENU_ID = "edit-menu";

// Fields that belong to one specific post and must not be carried over to
// its translation: the URL override, the redirect list and the links to the
// matching social posts. Deleting them from the payload leaves them empty.
const PER_POST_FIELDS = ["url", "oldUrl", "comments"];
const BUTTON_CLASS = "translate-button";

const LABELS = {
  en: {
    button: "Create English version",
    icon: "translate",
  },
  ja: {
    button: "Create Japanese version",
    icon: "translate",
  },
};

const TITLE =
  "Duplicates this post as a draft in the other language with the same ID, so the two are linked. Save first.";

const EXISTS_MESSAGE = "A translation already exists:";

const SAVING_MESSAGE = "Creating translation… (the site is rebuilding)";

/** Parse `/admin/collection/posts/<file>/edit` into the file name, or null. */
function currentPostFile(form) {
  const prefix = `${BASE}/collection/${COLLECTION}/`;
  const { pathname } = new URL(form.action, location.href);
  if (!pathname.startsWith(prefix) || !pathname.endsWith("/edit")) {
    return null;
  }
  const file = pathname.slice(prefix.length, -"/edit".length);
  return file ? decodeURIComponent(file) : null;
}

function twinFileName(file, targetLang) {
  if (LANG_SUFFIX.test(file)) {
    return file.replace(LANG_SUFFIX, (_m, _lang, offset) => {
      const separator = file[offset];
      return `${separator}${targetLang}.md`;
    });
  }
  return file.replace(/\.md$/, "") + `-${targetLang}.md`;
}

function editUrl(file) {
  return `${BASE}/collection/${COLLECTION}/${encodeURIComponent(file)}/edit`;
}

/** Check the collection list for an existing document with this file name. */
async function documentExists(file) {
  const response = await fetch(`${BASE}/collection/${COLLECTION}`, {
    headers: { Accept: "text/html" },
  });
  if (!response.ok) {
    throw new Error(`Could not list ${COLLECTION}: HTTP ${response.status}`);
  }
  const doc = new DOMParser().parseFromString(
    await response.text(),
    "text/html",
  );
  const wanted = editUrl(file);
  return Array.from(doc.querySelectorAll("a[href]")).some((a) => {
    const { pathname } = new URL(a.getAttribute("href"), location.href);
    return pathname === wanted;
  });
}

/**
 * Fields are namespaced by the root object ("root.lang", "root.draft"), so
 * derive the prefix from the language select instead of hard-coding it.
 */
function langSelect(form) {
  return form.querySelector('select[name="root.lang"], select[name="lang"]');
}

function toast(container, text) {
  const div = document.createElement("div");
  div.className = "tooltip is-toast";
  div.textContent = text;
  container.append(div);
  return div;
}

function showMessage(menu, text, link) {
  menu.querySelector(`.${BUTTON_CLASS}-message`)?.remove();
  const p = document.createElement("p");
  p.className = `${BUTTON_CLASS}-message`;
  p.style.padding = "0.5em 1em";
  p.style.maxWidth = "24em";
  p.append(text);
  if (link) {
    p.append(" ");
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.text;
    p.append(a);
  }
  menu.append(p);
}

async function createTranslation(form, menu, button, file, targetLang) {
  button.disabled = true;
  const twin = twinFileName(file, targetLang);
  let saving;
  try {
    if (await documentExists(twin)) {
      showMessage(menu, EXISTS_MESSAGE, { href: editUrl(twin), text: twin });
      button.disabled = false;
      return;
    }
    const select = langSelect(form);
    if (!select) {
      throw new Error("Language field not found");
    }
    const prefix = select.name.slice(0, -"lang".length); // "root." or ""

    // Same payload as the built-in Duplicate dialog (edit form + name),
    // with the language flipped and the copy forced to draft.
    const formData = new FormData(form);
    formData.set("name", twin);
    formData.set(`${prefix}lang`, targetLang);
    formData.set(`${prefix}draft`, "true");
    for (const key of Array.from(formData.keys())) {
      const isPerPost = PER_POST_FIELDS.some((name) =>
        key === `${prefix}${name}` || key.startsWith(`${prefix}${name}.`)
      );
      if (isPerPost) {
        formData.delete(key);
      }
    }

    menu.hidePopover?.();
    saving = toast(form.parentElement ?? document.body, SAVING_MESSAGE);

    // Submit via fetch like u-form.js does: the CMS rebuilds the site before
    // answering, which can exceed the Navigation API view-transition timeout.
    const response = await fetch(
      `${BASE}/collection/${COLLECTION}/${encodeURIComponent(file)}/duplicate`,
      { method: "POST", body: formData },
    );
    if (!response.ok) {
      throw new Error(`Duplicate failed: HTTP ${response.status}`);
    }
    location.href = response.url;
  } catch (error) {
    saving?.remove();
    showMessage(menu, `Error: ${error.message}`);
    button.disabled = false;
  }
}

function install() {
  const form = document.getElementById("form-edit");
  const menu = document.getElementById(MENU_ID);
  if (!form || !menu || menu.querySelector(`.${BUTTON_CLASS}`)) {
    return;
  }
  const file = currentPostFile(form);
  if (!file) {
    return;
  }

  const currentLang = langSelect(form)?.value || file.match(LANG_SUFFIX)?.[1];
  if (currentLang !== "ja" && currentLang !== "en") {
    return;
  }
  const targetLang = currentLang === "ja" ? "en" : "ja";
  const labels = LABELS[targetLang];

  const button = document.createElement("button");
  button.type = "button";
  button.className = `button is-secondary ${BUTTON_CLASS}`;
  button.title = TITLE;
  const icon = document.createElement("u-icon");
  icon.setAttribute("name", labels.icon);
  button.append(icon, ` ${labels.button}`);
  button.addEventListener("click", () => {
    createTranslation(form, menu, button, file, targetLang);
  });

  // Place it right after the built-in Duplicate dialog (button + <dialog>),
  // before Delete. No Duplicate button means no create permission: skip.
  const duplicate = menu.querySelector('[commandfor="modal-duplicate"]');
  if (!duplicate) {
    return;
  }
  const dialog = duplicate.nextElementSibling;
  const after = dialog?.matches("dialog") ? dialog : duplicate;
  after.after(button);
}

// The CMS swaps `.app-container` in place on navigation (Navigation API), so
// re-run whenever the body's children change, as well as on first load.
install();
new MutationObserver(install).observe(document.body, { childList: true });
