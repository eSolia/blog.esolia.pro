/**
 * The canonical form of a post byline.
 *
 * A byline is both what a post displays and the key of its author page
 * (/author/<byline>/), so two spellings of one person become two author
 * pages. That happened: "Sachiko Kosuge " (trailing space) and "SK&Shiori"
 * each got a page of their own and now survive only as redirects in
 * src/_data/authors.yml `former_bylines`.
 *
 * Trims the ends, collapses runs of whitespace, and writes a joint byline's
 * ampersand with one space either side ("SK & Shiori").
 */
export function normalizeByline(byline: string): string {
  return byline.replace(/\s*&\s*/g, " & ").replace(/\s+/g, " ").trim();
}
