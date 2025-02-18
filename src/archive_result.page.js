export const layout = "layouts/archive_result.vto";
export const lang = "ja";

export default function* ({ search, i18n }) {
  // Generate a page for each tag
  for (const tag of search.values("tags", `lang=${lang}`)) {
    yield {
      url: `/archive/${tag}/`,
      title: `${i18n.search.by_tag}  “${tag}”`,
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
      title: `${i18n.search.by_author} ${author}`,
      type: "author",
      search_query: `type=post lang=${lang} author='${author}'`,
      author,
      i18n,
    };
  }
}