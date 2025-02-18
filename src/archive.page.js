export const layout = "layouts/archive.vto";

export default function* ({ search, paginate, ja, lang }) {
  const posts = search.pages(`type=post lang=${lang}`, "date=desc");

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
      title: `${ja.i18n.nav.archive_title}`,
    };
  }
}

function url(n) {
  if (n === 1) {
    return "/archive/";
  }

  return `/archive/${n}/`;
}
