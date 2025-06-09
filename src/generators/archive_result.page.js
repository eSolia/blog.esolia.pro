export const layout = "layouts/archive_result.vto";
export const lang = ["ja", "en"];
// export const id = "archiveresult";

export default function* ({ search, lang, i18n, featuretags, featurecats }) {
  // Generate a page for each tag
  for (const tag of search.values("tags", `lang=${lang}`)) {
    yield {
      ...featuretags.find((item) => item.key === tag), // <- Add the id and summary etc from featuretags
      url: `/archive/${tag}/`,
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
