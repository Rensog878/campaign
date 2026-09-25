import { formatInTimeZone } from "date-fns-tz";

export const APP_TZ = process.env.APP_TIMEZONE ?? "Asia/Kolkata";

export function fmtDate(d: Date | null | undefined, pattern = "d MMM yyyy, h:mm a") {
  return d ? formatInTimeZone(d, APP_TZ, pattern) : "—";
}

export function fmtNumber(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function pct(part: number, whole: number) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

/** A moment `n` days before now. Kept out of components so renders stay pure. */
export function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}
