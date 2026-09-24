export const layout = "layouts/archive.vto";
export const lang = ["ja", "en"];

export default function* ({ search, paginate, lang, i18n }) {
  // Paginated archive listing isn't needed for the CMS editor preview. Skip it
  // under the CMS (LUME_CMS=true) to shrink the rebuild window; the public
  // Cloudflare build still generates it.
  if (Deno.env.get("LUME_CMS") === "true") return;
  const posts = search.pages(`type=post lang=${lang}`, "date=desc");

  // Moved inside the default function to use the `lang` variable passed.
  function url(n) {
    if (n === 1) {
      return lang === "ja" ? `/archive/` : `/${lang}/archive/`;
    }
    return lang === "ja" ? `/archive/${n}/` : `/${lang}/archive/${n}/`;
  }

  // The numbers the pager shows: always the first, the last and the current
  // page, plus one either side, with a gap marker wherever a run was skipped.
  // Computed here rather than in the template because only this function knows
  // how a page number becomes a URL.
  function pagerItems(current, total) {
    const numbers = new Set([1, total, current]);
    for (let n = current - 1; n <= current + 1; n++) {
      if (n >= 1 && n <= total) numbers.add(n);
    }

    const items = [];
    let previous = 0;
    for (const n of [...numbers].sort((a, b) => a - b)) {
      // A gap standing in for a single page is a worse link than the page
      // number it hides, so only elide a run of two or more.
      if (n - previous === 2) {
        const skipped = n - 1;
        items.push({ n: skipped, url: url(skipped), current: false });
      } else if (previous && n - previous > 1) {
        items.push({ gap: true });
      }
      items.push({ n, url: url(n), current: n === current });
      previous = n;
    }
    return items;
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
      pager: pagerItems(data.pagination.page, data.pagination.totalPages),
      title: i18n.nav.archive_title,
      id: `archive-${data.pagination.page}`, // To link the JA and EN versions
    };
  }
}
