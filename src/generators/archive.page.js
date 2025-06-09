export const layout = "layouts/archive.vto";
export const lang = ["ja", "en"];

export default function* ({ search, paginate, lang, i18n }) {
  const posts = search.pages(`type=post lang=${lang}`, "date=desc");

  // Moved inside the default function to use the `lang` variable passed.
  function url(n) {
    if (n === 1) {
      return lang === "ja" ? `/archive/` : `/${lang}/archive/`;
    }
    return lang === "ja" ? `/archive/${n}/` : `/${lang}/archive/${n}/`;
  }

  for (
    const data of paginate(posts, { url, size: 10 })
  ) {
    // Show the first page in the menu
    if (data.pagination.page === 1) {
      data.menu = {
        visible: true,
        order: 1,
      };
    }

    yield {
      ...data,
      title: i18n.nav.archive_title,
      id: `archive-${data.pagination.page}`, // To link the JA and EN versions
    };
  }
}
