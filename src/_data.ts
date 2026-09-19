export const todaysDateYYYYMMDD = `${new Date().toISOString().split("T")[0]}`;

export const currentDateTime = Temporal.Now.zonedDateTimeISO();
console.log(
  `Current temporal timezoned datetime: ${currentDateTime.toString()}`,
);

export const currentDateTimeInTokyo = Temporal.Now.zonedDateTimeISO(
  "Asia/Tokyo",
);
console.log(`Current temporal datetime in Tokyo: ${currentDateTimeInTokyo}`);

console.log(
  `Current temporal date in Tokyo: ${currentDateTimeInTokyo.toPlainDate()}`,
);

const formatter = new Intl.DateTimeFormat("ja-JP-u-ca-japanese", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Tokyo",
});
const formattedDate = formatter.format(currentDateTimeInTokyo.toPlainDate());
console.log("Kanji? " + formattedDate);

export const currentJapanLocaleDateTimeInTokyo = currentDateTimeInTokyo
  .toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
console.log(currentJapanLocaleDateTimeInTokyo);

export const currentDateTimeYYYYMMDDHHMM = currentJapanLocaleDateTimeInTokyo
  .replace(/[^0-9]/g, "").slice(0, 12);
console.log(currentDateTimeYYYYMMDDHHMM);

const now = Temporal.Now.instant();
const fmtArgs = [
  ["ja-JP"],
  {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
];
console.log(new Intl.DateTimeFormat(...fmtArgs).format(now.epochMilliseconds));

const ima = Temporal.Now.zonedDateTimeISO();
const fmtArgs2 = [
  ["en-US"],
  {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "EST",
  },
];
console.log(new Intl.DateTimeFormat(...fmtArgs2).format(ima.epochMilliseconds));

// const now = Temporal.Now.zonedDateTimeISO('Asia/Tokyo');
// const formatter = new Intl.DateTimeFormat('ja-JP', {
//   year: 'numeric',
//   month: 'long',
//   day: 'numeric',
//   timeZone: 'Asia/Tokyo'
// });
// const formattedDate = formatter.format(now);
// console.log(formattedDate);

// const sampleDate = "Wed Feb 26 2025 10:56:29 GMT+0900 (日本標準時)";
// const sampleDate = "2025-02-26T10:56:29.000Z";
// const tdate = Temporal.ZonedDateTime.from(sampleDate);
// console.log(tdate.toString());
// console.log(tdate.toPlainDate().toString());
// console.log(tdate.toPlainTime().toString());
// console.log(tdate.toPlainDateTime().toString());
// console.log(tdate.toPlainYearMonth().toString());
// console.log(tdate.toPlainMonthDay().toString());

const sampleValue = "2025-02-26T10:56:29.000Z";
const sampleInstant = Temporal.Instant.from(sampleValue);
const sampleLocale = "ja-JP";
const sampleTimezone = "Asia/Tokyo";
// const recdZonedDateTime = Temporal.ZonedDateTime.from(sampleInstant).withTimeZone(sampleTimezone);
const recdZonedDateTime = sampleInstant.toZonedDateTimeISO(sampleTimezone);
const formatArgs = [
  sampleLocale,
  {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: sampleTimezone,
  },
];
console.log(
  new Intl.DateTimeFormat(...formatArgs).format(
    recdZonedDateTime.toInstant().epochMilliseconds,
  ),
);

export const cacheBuster = `${Temporal.Now.instant().epochMilliseconds}`;
console.log(`Cache buster: ${cacheBuster}`);
console.log(`Deno args: ${Deno.args}`);

// Years-in-business text, exposed to templates as `yearsInBusiness`. Keyed by
// language because the phrasing differs structurally, not just lexically:
// English needs "more than 27" / "almost 28", Japanese needs 27年以上 / 約28年.
// See src/_years_in_business.ts for why a bare year subtraction is not enough.
import { buildText, computeYearsInfo } from "./_years_in_business.ts";

const yearsInfo = computeYearsInfo();
export const yearsInBusiness = buildText(yearsInfo.years, yearsInfo.phase);
console.log(
  `Years in business: ${yearsInfo.years} (${yearsInfo.phase}) -> en "${yearsInBusiness.en.approx}" / ja "${yearsInBusiness.ja.approx}"`,
);
