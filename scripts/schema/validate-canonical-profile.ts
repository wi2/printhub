/**
 * Runtime validation for canonical JSON profile documents.
 *
 * Validates structure, schema version, metadata, and parameter completeness.
 * Does not modify input — invalid profiles fail fast with descriptive errors.
 *
 * Validation guarantees structural correctness only. It does not validate print
 * quality or physical suitability.
 *
 * @see docs/architecture/canonical-profile-model.md
 */

import { buildSlug } from '../../src/lib/slug.js';
import {
  CANONICAL_PARAMETER_SCHEMA,
  REQUIRED_CANONICAL_PARAMETER_KEYS,
  type RequiredCanonicalParameterKey,
} from './canonical-parameters.js';
import {
  SUPPORTED_SCHEMA_VERSION,
  type CanonicalProfile,
  type CanonicalProfileCombination,
  type CanonicalProfileMetadata,
  type CanonicalProfileParameters,
} from './canonical-profile.js';

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function assertRecord(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object, got ${formatValue(value)}`);
  }
  return value as Record<string, unknown>;
}

function assertNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string, got ${formatValue(value)}`);
  }
  return value;
}

function validateCombination(value: unknown): CanonicalProfileCombination {
  const combination = assertRecord(value, 'metadata.combination');

  return {
    printer: assertNonEmptyString(combination.printer, 'metadata.combination.printer'),
    material: assertNonEmptyString(combination.material, 'metadata.combination.material'),
    nozzle: assertNonEmptyString(combination.nozzle, 'metadata.combination.nozzle'),
    goal: assertNonEmptyString(combination.goal, 'metadata.combination.goal'),
  };
}

function validateSchemaVersion(value: unknown): typeof SUPPORTED_SCHEMA_VERSION {
  if (value !== SUPPORTED_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported schema version "${String(value)}" (supported: "${SUPPORTED_SCHEMA_VERSION}")`,
    );
  }
  return SUPPORTED_SCHEMA_VERSION;
}

function validateVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(
      `metadata.version must be a positive integer, got ${formatValue(value)}`,
    );
  }
  return value;
}

function validateSlug(slug: string, combination: CanonicalProfileCombination): string {
  const expectedSlug = buildSlug(
    combination.printer,
    combination.material,
    combination.nozzle,
    combination.goal,
  );

  if (slug !== expectedSlug) {
    throw new Error(
      `metadata.slug "${slug}" does not match combination (expected "${expectedSlug}")`,
    );
  }

  return slug;
}

function validateMetadata(value: unknown): CanonicalProfileMetadata {
  if (value === undefined) {
    throw new Error('metadata is required');
  }

  const metadata = assertRecord(value, 'metadata');
  const combination = validateCombination(metadata.combination);
  const slug = assertNonEmptyString(metadata.slug, 'metadata.slug');

  return {
    schemaVersion: validateSchemaVersion(metadata.schemaVersion),
    version: validateVersion(metadata.version),
    slug: validateSlug(slug, combination),
    combination,
  };
}

function validateParameterValue(
  key: RequiredCanonicalParameterKey,
  value: unknown,
): string | number | boolean {
  const expectedType = CANONICAL_PARAMETER_SCHEMA[key];

  switch (expectedType) {
    case 'string':
      if (typeof value !== 'string') {
        throw new Error(
          `parameters.${key} must be string, got ${formatValue(value)}`,
        );
      }
      return value;
    case 'number':
      if (typeof value !== 'number') {
        throw new Error(
          `parameters.${key} must be number, got ${formatValue(value)}`,
        );
      }
      return value;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new Error(
          `parameters.${key} must be boolean, got ${formatValue(value)}`,
        );
      }
      return value;
  }
}

function validateParameters(value: unknown): CanonicalProfileParameters {
  if (value === undefined) {
    throw new Error('parameters is required');
  }

  const parameters = assertRecord(value, 'parameters');
  const actualKeys = Object.keys(parameters);

  const missing = REQUIRED_CANONICAL_PARAMETER_KEYS.filter(key => !(key in parameters));
  if (missing.length > 0) {
    throw new Error(`parameters missing required keys: ${missing.join(', ')}`);
  }

  const unknown = actualKeys.filter(
    key => !REQUIRED_CANONICAL_PARAMETER_KEYS.includes(key as RequiredCanonicalParameterKey),
  );
  if (unknown.length > 0) {
    throw new Error(`parameters contain unknown keys: ${unknown.join(', ')}`);
  }

  const validated = {} as CanonicalProfileParameters;

  for (const key of REQUIRED_CANONICAL_PARAMETER_KEYS) {
    validated[key] = validateParameterValue(key, parameters[key]);
  }

  return validated;
}

/**
 * Validates an unknown value as a complete canonical profile document.
 *
 * @throws {Error} When the value is not a structurally valid CanonicalProfile.
 * @returns Typed CanonicalProfile — safe for serializers and downstream workflows.
 */
export function validateCanonicalProfile(profile: unknown): CanonicalProfile {
  const root = assertRecord(profile, 'profile');

  return {
    metadata: validateMetadata(root.metadata),
    parameters: validateParameters(root.parameters),
  };
}
