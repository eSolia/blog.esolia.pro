export const layout = "layouts/archive_result.vto";
export const lang = ["ja", "en"];
// export const id = "archiveresult";

export default function* (
  { search, lang, i18n, featuretags, featurecats, tagaliases },
) {
  // Per-tag/category archive pages (~68% of all pages) aren't needed for the CMS
  // editor preview. Skip them under the CMS (LUME_CMS=true) to shrink the
  // rebuild window; the public Cloudflare build still generates them.
  if (Deno.env.get("LUME_CMS") === "true") return;
  // Generate a page for each tag
  // Retired tag names redirect to the tag that replaced them. Consolidating a
  // tag removes its page, so without these every link and bookmark pointing at
  // the old name 404s — silently, because nothing in the build fails. See
  // src/_data/tagaliases.yml.
  // The multilanguage plugin prefixes `url` for non-default languages but does
  // NOT touch `oldUrl`, so the prefix has to be applied by hand. Without it the
  // English redirects are emitted at /archive/<name>/ and collide with the
  // Japanese tag pages of the same name — the build reports a duplicate output
  // path for Microsoft365, SharePointOnline and Windows10.
  const localePrefix = lang === "ja" ? "" : `/${lang}`;
  const aliasesFor = (tag) => tagaliases?.[lang]?.[tag] ?? [];

  for (const tag of search.values("tags", `lang=${lang}`)) {
    yield {
      ...featuretags.find((item) => item.key === tag), // <- Add the id and summary etc from featuretags
      url: `/archive/${tag}/`,
      // Percent-encode the retired name. The redirects plugin splits each
      // oldUrl on whitespace to allow an optional trailing status code, so a
      // name like "internal IT support" is read as a path plus the status
      // "support" and rejected as an invalid status code.
      oldUrl: aliasesFor(tag).map(
        (old) => `${localePrefix}/archive/${encodeURIComponent(old)}/`,
      ),
      title: `${i18n.search.by_tag}:`,
      subtitle:
        `${i18n.punctuation.open_quote}${tag}${i18n.punctuation.close_quote}`,
      type: "tag",
      search_query: `type=post lang=${lang} '${tag}'`,
      tag,
      i18n,
    };
  }
  // Generate a page for each author
  for (const author of search.values("author", `lang=${lang}`)) {
    yield {
      url: `/author/${author}/`,
      title: `${i18n.search.by_author}:`,
      subtitle:
        `${i18n.punctuation.open_quote}${author}${i18n.punctuation.close_quote}`,
      type: "author",
      search_query: `type=post lang=${lang} author='${author}'`,
      author,
      i18n,
    };
  }
  // Generate a page for each category
  for (const category of search.values("category", `lang=${lang}`)) {
    yield {
      ...featurecats.find((item) => item.key === category), // <- Add the id and summary etc from featurecats
      url: `/category/${category}/`,
      title: `${i18n.search.by_category}:`,
      subtitle:
        `${i18n.punctuation.open_quote}${category}${i18n.punctuation.close_quote}`,
      type: "category",
      search_query: `type=post lang=${lang} category='${category}'`,
      category,
      i18n,
    };
  }
}
