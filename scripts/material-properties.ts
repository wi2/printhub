/**
 * Material physical properties consumed by serializers.
 *
 * Density values are in g/cm³ — used for slicer filament weight/cost estimation.
 * Sourced from Prusament and OrcaSlicer default filament presets.
 */

const FILAMENT_DENSITY_G_CM3: Record<string, number> = {
  pla: 1.24,
  petg: 1.27,
};

/**
 * Returns the filament density for a material ID.
 *
 * @param materialId - Lowercase material ID (e.g. `pla`, `petg`)
 * @throws When the material has no defined density
 */
export function getFilamentDensity(materialId: string): number {
  const density = FILAMENT_DENSITY_G_CM3[materialId];
  if (density === undefined) {
    throw new Error(`No filament density defined for material: ${materialId}`);
  }
  return density;
}
