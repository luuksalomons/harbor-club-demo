export const CLUB_TIMEZONE = "Europe/Amsterdam";

// Converts a "datetime-local" value (e.g. "2026-09-07T09:00", meant as a
// local clock time for the club) into a correct UTC ISO string — without
// relying on the timezone of the server running this code. Needed because
// `new Date("2026-09-07T09:00").toISOString()` uses the *server's* timezone
// to interpret the input, and that differs between local dev (often
// Europe/Amsterdam) and Vercel (UTC) — that caused a 1-2 hour shift.
export function localDateTimeToUtcIso(local: string): string {
  const [datePart, timePart] = local.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asAmsterdam = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );

  const offset = asAmsterdam - guess.getTime();
  return new Date(guess.getTime() - offset).toISOString();
}

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateParam(date: Date): string {
  // Note: do NOT use toISOString() here — that converts to UTC and can
  // shift the date back a day whenever the server timezone is ahead of UTC
  // (e.g. Europe/Amsterdam). date is built with local setters/getters, so
  // build the string the same way instead of going through UTC.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
