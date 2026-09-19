/**
 * Years-in-business calculation and placeholder replacement.
 *
 * Kept deliberately identical to esolia-2025's
 * `src/lib/content/years-in-business.ts`, which carries the note "Ported from
 * src/_data.ts (Lume)" — this repo is where the logic started, then lost it,
 * which is how the blog ended up saying "approaching 27 years" after the 27th
 * anniversary had already passed. If the phrasing rules change, change both.
 *
 * eSolia was founded 1999-07-07, so for most of the year the plain
 * `getFullYear() - 1999` this replaced is off by one in one direction or the
 * other: before July 7 it counts a year that has not completed, and after it
 * "approaching" is simply wrong.
 */

const FOUNDING_YEAR = 1999;
const FOUNDING_MONTH = 7; // July
const FOUNDING_DAY = 7;

export type Phase = "exact" | "more-than" | "almost";

export interface YearsInfo {
  years: number;
  phase: Phase;
}

export function computeYearsInfo(now: Date = new Date()): YearsInfo {
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  const hasPassedAnniversary = month > FOUNDING_MONTH ||
    (month === FOUNDING_MONTH && day >= FOUNDING_DAY);

  const years = hasPassedAnniversary
    ? year - FOUNDING_YEAR
    : year - FOUNDING_YEAR - 1;

  let phase: Phase;
  if (hasPassedAnniversary && month === FOUNDING_MONTH) {
    // Anniversary month (July): exact age, e.g. "27 years" / "27年"
    phase = "exact";
  } else if (!hasPassedAnniversary && month >= FOUNDING_MONTH - 2) {
    // The run-up (May–early July before the 7th): almost the next age
    phase = "almost";
  } else {
    // Rest of the year, once the anniversary has passed: more than current age
    phase = "more-than";
  }

  return { years, phase };
}

export function buildText(years: number, phase: Phase) {
  const nextYear = years + 1;

  return {
    en: {
      exact: `${years}`,
      approx: phase === "exact"
        ? `${years}`
        : phase === "almost"
        ? `almost ${nextYear}`
        : `more than ${years}`,
      approxCap: phase === "exact"
        ? `${years}`
        : phase === "almost"
        ? `Almost ${nextYear}`
        : `More than ${years}`,
      phrase: phase === "exact"
        ? `for ${years} years`
        : phase === "almost"
        ? `for almost ${nextYear} years`
        : `for more than ${years} years`,
    },
    ja: {
      exact: `${years}`,
      // Grammatically uniform so it slots into running text in every phase
      // (e.g. "…にわたり", "…の実績", "…支援"): 27年 / 約27年 / 27年以上.
      approx: phase === "exact"
        ? `${years}年`
        : phase === "almost"
        ? `約${nextYear}年`
        : `${years}年以上`,
      approxCap: phase === "exact"
        ? `${years}年`
        : phase === "almost"
        ? `約${nextYear}年`
        : `${years}年以上`,
      phrase: phase === "exact"
        ? `${years}年`
        : phase === "almost"
        ? `約${nextYear}年`
        : `${years}年以上`,
    },
  };
}

/** Replace every YEARS_IN_BUSINESS_* placeholder in a string. */
export function replaceYearsPlaceholders(
  content: string,
  lang: "ja" | "en",
): string {
  const { years, phase } = computeYearsInfo();
  const t = buildText(years, phase)[lang];

  return content
    .replace(/YEARS_IN_BUSINESS_APPROX_CAP/g, t.approxCap)
    .replace(/YEARS_IN_BUSINESS_APPROX/g, t.approx)
    .replace(/YEARS_IN_BUSINESS_PHRASE/g, t.phrase)
    .replace(/YEARS_IN_BUSINESS_EXACT/g, t.exact)
    .replace(/YEARS_IN_BUSINESS/g, t.exact);
}
