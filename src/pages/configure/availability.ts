import type { Manifest } from '../../types';

let manifest: Manifest | undefined = undefined;

async function loadManifest(): Promise<Manifest> {
  if (!manifest) {
    manifest = (await fetch('/combinations.json').then(r => r.json())) as Manifest;
  }
  return manifest;
}

/**
 * Returns true if a validated profile exists for the given printer + material +
 * nozzle + goal combination. Loads the manifest on first call; subsequent calls
 * use the module-level cache.
 */
export async function isAvailable(
  printer: string,
  material: string,
  nozzle: string,
  goal: string,
): Promise<boolean> {
  const m = await loadManifest();
  return m.combinations.some(
    c =>
      c.printer === printer &&
      c.material === material &&
      c.nozzle === nozzle &&
      c.goal === goal &&
      c.isAvailable,
  );
}

/**
 * Returns true if any validated profile exists for the given printer + material,
 * regardless of nozzle size or goal. Used to grey out unavailable material options.
 */
export async function isMaterialAvailable(
  printer: string,
  material: string,
): Promise<boolean> {
  const m = await loadManifest();
  return m.combinations.some(
    c => c.printer === printer && c.material === material && c.isAvailable,
  );
}

/**
 * Returns true if any validated profile exists for the given printer + material +
 * nozzle, regardless of goal. Used to detect whether a "not yet validated" message
 * should be shown when the user selects a specific nozzle size.
 */
export async function isNozzleAvailable(
  printer: string,
  material: string,
  nozzle: string,
): Promise<boolean> {
  const m = await loadManifest();
  return m.combinations.some(
    c =>
      c.printer === printer &&
      c.material === material &&
      c.nozzle === nozzle &&
      c.isAvailable,
  );
}

/**
 * Resets the module-level manifest cache.
 * Call this in afterEach when testing to prevent cache bleed between tests.
 */
export function _resetManifestCache(): void {
  manifest = undefined;
}
