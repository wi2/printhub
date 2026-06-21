/**
 * Constructs the canonical combination slug used in profile URLs and filenames.
 * Format: [printer]-[material]-[nozzleSlug]-[goal]
 * Nozzle transformation: "0.4" → "04mm", "0.6" → "06mm"
 */
export function buildSlug(
  printer: string,
  material: string,
  nozzle: string,
  goal: string,
): string {
  const nozzleSlug = `${nozzle.replace('.', '')}mm`;
  return `${printer}-${material}-${nozzleSlug}-${goal}`;
}
