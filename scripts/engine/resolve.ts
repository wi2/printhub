import type { LayerSchema, ResolvedParams } from './types';

/**
 * Merges an ordered array of layers into a single resolved parameter map.
 *
 * Layers must be provided in specificity order (broadest first):
 *   global defaults → printer → material → goal → nozzle → override
 *
 * When two layers set the same key, the later (more specific) layer wins.
 * An absent override layer is handled naturally — just omit it from the array.
 *
 * Pure function. No file I/O. No side effects.
 */
export function resolve(layers: LayerSchema[]): ResolvedParams {
  return Object.assign({}, ...layers);
}
