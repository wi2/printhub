/**
 * Single source of truth for required canonical profile parameters.
 *
 * Keys and value types match `docs/architecture/parameter-schema.md`.
 * Validation uses this module to enforce completeness — no missing keys,
 * no unknown keys, and correct primitive types per key.
 *
 * @see docs/architecture/parameter-schema.md
 */

export type CanonicalParameterType = 'string' | 'number' | 'boolean';

/**
 * Required parameter keys and their value types for a complete CanonicalProfile.
 * Exactly 34 keys — one entry per parameter in the parameter schema.
 */
export const CANONICAL_PARAMETER_SCHEMA = {
  // Printer characteristics
  firmwareFlavor: 'string',
  motionSystem: 'string',
  bedSizeX: 'number',
  bedSizeY: 'number',
  maxPrintHeight: 'number',
  maxSpeed: 'number',
  maxAcceleration: 'number',
  travelSpeed: 'number',
  // Speeds
  printSpeed: 'number',
  firstLayerSpeed: 'number',
  externalPerimeterSpeed: 'number',
  infillSpeed: 'number',
  // Temperatures
  nozzleTemp: 'number',
  firstLayerNozzleTemp: 'number',
  bedTemp: 'number',
  firstLayerBedTemp: 'number',
  // Cooling
  fanSpeed: 'number',
  fanSpeedMin: 'number',
  fanKickInLayer: 'number',
  // Layer geometry
  layerHeight: 'number',
  firstLayerHeight: 'number',
  minLayerHeight: 'number',
  maxLayerHeight: 'number',
  // Nozzle and extrusion
  nozzleDiameter: 'number',
  lineWidth: 'number',
  maxVolumetricSpeed: 'number',
  // Shell and infill
  perimeterCount: 'number',
  topSolidLayers: 'number',
  bottomSolidLayers: 'number',
  infillDensity: 'number',
  infillPattern: 'string',
  // Retraction
  retractLength: 'number',
  retractSpeed: 'number',
  deretractSpeed: 'number',
  // Support
  supportEnabled: 'boolean',
} as const satisfies Record<string, CanonicalParameterType>;

export type RequiredCanonicalParameterKey = keyof typeof CANONICAL_PARAMETER_SCHEMA;

/** All parameter keys required in a complete canonical profile. */
export const REQUIRED_CANONICAL_PARAMETER_KEYS: ReadonlyArray<RequiredCanonicalParameterKey> =
  Object.keys(CANONICAL_PARAMETER_SCHEMA) as RequiredCanonicalParameterKey[];
