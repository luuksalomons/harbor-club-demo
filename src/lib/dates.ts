export const NL_TIMEZONE = "Europe/Amsterdam";

// Zet een "datetime-local"-waarde (bv. "2026-09-07T09:00", bedoeld als
// Nederlandse kloktijd) om naar een correcte UTC ISO-string — zonder te
// vertrouwen op de tijdzone van de server die dit uitvoert. Nodig omdat
// `new Date("2026-09-07T09:00").toISOString()` de servertijdzone gebruikt
// om de invoer te interpreteren, en die verschilt tussen lokaal (Europe/
// Amsterdam) en Vercel (UTC) — dat gaf een verschuiving van 1-2 uur.
export function localDateTimeToUtcIso(local: string): string {
  const [datePart, timePart] = local.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);

  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NL_TIMEZONE,
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

export const DAG_NAMEN = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = zondag
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
  // Let op: NIET toISOString() gebruiken — die converteert naar UTC en
  // schuift de datum een dag terug zodra de servertijdzone voor op UTC
  // loopt (bv. Europe/Amsterdam). date is opgebouwd met lokale
  // setters/getters, dus hier ook lokaal opbouwen i.p.v. via UTC.
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
