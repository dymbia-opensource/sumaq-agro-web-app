/**
 * Dates exchanged with the RESTful API, in `YYYY-MM-DD` format.
 *
 * @remarks
 * `new Date('2026-10-15')` reads the text as UTC midnight, which in Peru
 * (UTC-5) is still the day before. These helpers keep the same calendar day
 * in both directions, so every assembler converts dates the same way.
 */

/**
 * Reads a `YYYY-MM-DD` date of the API as a local date.
 * @param value - Date sent by the API, for example `2026-10-15`.
 */
export function fromApiDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Writes a date in the `YYYY-MM-DD` format of the API.
 * @param date - Local date.
 */
/** Today in the time zone of the fields, as `YYYY-MM-DD`. */
export function todayInLima(): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;

  return get('year') + '-' + get('month') + '-' + get('day');
}

export function toApiDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
