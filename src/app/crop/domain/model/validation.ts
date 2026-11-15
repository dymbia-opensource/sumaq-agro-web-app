/** Domain invariants shared by Crop Health entities. */
export function requireId(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('crop.errors.invalid-data');
}
export function requireText(value: string, minimum = 1): void {
  if (typeof value !== 'string' || value.trim().length < minimum)
    throw new Error('crop.errors.invalid-data');
}
export function requireRange(value: number, minimum: number, maximum = Infinity): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum)
    throw new Error('crop.errors.invalid-data');
}
export function requireDate(value: string): void {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error('crop.errors.invalid-data');
  if (new Date(value.slice(0, 10)).toISOString().slice(0, 10) !== value.slice(0, 10))
    throw new Error('crop.errors.invalid-data');
}
export function requireChoice(value: string, choices: readonly string[]): void {
  if (!choices.includes(value)) throw new Error('crop.errors.invalid-data');
}
