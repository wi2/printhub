/**
 * Profile build script.
 *
 * Resolves all 20 launch combinations, validates them against guardrails,
 * serialises each to the appropriate slicer format, writes profile files,
 * and produces generated/combinations.json.
 *
 * Usage: npx tsx scripts/build.ts
 *
 * Exit codes:
 *   0 — build succeeded (some combinations may have been skipped via guardrail)
 *   1 — hard error (file read failure, unexpected exception)
 *
 * Output structure:
 *   generated/
 *     combinations.json               — manifest consumed by the frontend
 *     profiles/
 *       [slug].json                   — canonical JSON profile (slicer-agnostic)
 *       prusaslicer/[slug].ini        — for Prusa MK4 and Creality Ender 3 V3 SE
 *       bambu-orca/[slug].3mf         — for Bambu A1 Mini, X1C, and Creality K1
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { parse } from 'yaml';
import { resolve as resolveLayers } from './engine/resolve.js';
import { validate } from './engine/validate.js';
import { serialize as serializePrusaSlicer } from './serializers/prusaslicer.js';
import { serialize as serializeBambuOrca } from './serializers/bambu-orca.js';
import { buildCanonicalProfile } from './schema/build-canonical-profile.js';
import { serializeCanonicalProfileToJson } from './schema/serialize-canonical-profile.js';
import { publishGeneratedToPublic } from './publish-generated.js';
import type { LayerSchema, GuardrailBounds } from './engine/types.js';
import { PRINTERS } from '../src/types.js';
import type { ManifestEntry } from '../src/types.js';
import { HIGHLIGHTS } from './highlights.js';
import { buildSlug } from '../src/lib/slug.js';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const LAYERS_DIR = resolve(ROOT, 'layers');
const GENERATED_DIR = resolve(ROOT, 'generated');
const PROFILES_DIR = resolve(GENERATED_DIR, 'profiles');
const PRUSASLICER_DIR = resolve(PROFILES_DIR, 'prusaslicer');
const BAMBU_ORCA_DIR = resolve(PROFILES_DIR, 'bambu-orca');

// ---------------------------------------------------------------------------
// Launch combinations — 20 combinations per epic-mvp.md scope challenge Cut 4.
// PLA + PETG, all 5 printers, both nozzle sizes, Balanced goal only.
// ---------------------------------------------------------------------------

type LaunchSpec = { printer: string; material: string; nozzle: string; goal: string };

const LAUNCH_COMBINATIONS: LaunchSpec[] = [
  { printer: 'bambu-a1-mini',          material: 'pla',  nozzle: '0.4', goal: 'balanced' },
  { printer: 'bambu-a1-mini',          material: 'pla',  nozzle: '0.6', goal: 'balanced' },
  { printer: 'bambu-a1-mini',          material: 'petg', nozzle: '0.4', goal: 'balanced' },
  { printer: 'bambu-a1-mini',          material: 'petg', nozzle: '0.6', goal: 'balanced' },
  { printer: 'bambu-x1c',             material: 'pla',  nozzle: '0.4', goal: 'balanced' },
  { printer: 'bambu-x1c',             material: 'pla',  nozzle: '0.6', goal: 'balanced' },
  { printer: 'bambu-x1c',             material: 'petg', nozzle: '0.4', goal: 'balanced' },
  { printer: 'bambu-x1c',             material: 'petg', nozzle: '0.6', goal: 'balanced' },
  { printer: 'prusa-mk4',             material: 'pla',  nozzle: '0.4', goal: 'balanced' },
  { printer: 'prusa-mk4',             material: 'pla',  nozzle: '0.6', goal: 'balanced' },
  { printer: 'prusa-mk4',             material: 'petg', nozzle: '0.4', goal: 'balanced' },
  { printer: 'prusa-mk4',             material: 'petg', nozzle: '0.6', goal: 'balanced' },
  { printer: 'creality-ender-3-v3-se', material: 'pla',  nozzle: '0.4', goal: 'balanced' },
  { printer: 'creality-ender-3-v3-se', material: 'pla',  nozzle: '0.6', goal: 'balanced' },
  { printer: 'creality-ender-3-v3-se', material: 'petg', nozzle: '0.4', goal: 'balanced' },
  { printer: 'creality-ender-3-v3-se', material: 'petg', nozzle: '0.6', goal: 'balanced' },
  { printer: 'creality-k1',           material: 'pla',  nozzle: '0.4', goal: 'balanced' },
  { printer: 'creality-k1',           material: 'pla',  nozzle: '0.6', goal: 'balanced' },
  { printer: 'creality-k1',           material: 'petg', nozzle: '0.4', goal: 'balanced' },
  { printer: 'creality-k1',           material: 'petg', nozzle: '0.6', goal: 'balanced' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadLayer(path: string): LayerSchema {
  const raw = readFileSync(path, 'utf-8');
  return parse(raw) as LayerSchema;
}

/** Converts a nozzle ID (e.g. "0.4") to the nozzle layer filename (e.g. "0.4mm.yaml"). */
function nozzleLayerFile(nozzleId: string): string {
  return `${nozzleId}mm.yaml`;
}

/** Looks up the slicer format for a printer ID. Returns 'prusaslicer' or 'bambu-orca'. */
function slicerFormatForPrinter(printerId: string): 'prusaslicer' | 'bambu-orca' {
  const printer = PRINTERS.find(p => p.id === printerId);
  if (!printer) throw new Error(`Unknown printer id: ${printerId}`);
  return printer.defaultSlicerFormat as 'prusaslicer' | 'bambu-orca';
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function run(): void {
  ensureDir(GENERATED_DIR);
  ensureDir(PRUSASLICER_DIR);
  ensureDir(BAMBU_ORCA_DIR);

  // Load shared layers once.
  const globalDefaults = loadLayer(join(LAYERS_DIR, 'global-defaults.yaml'));
  const guardrails = parse(
    readFileSync(join(LAYERS_DIR, 'guardrails.yaml'), 'utf-8'),
  ) as GuardrailBounds;

  const manifest: ManifestEntry[] = [];
  let built = 0;
  let skipped = 0;

  console.log(`PrintHub build — ${LAUNCH_COMBINATIONS.length} combinations\n`);

  for (const spec of LAUNCH_COMBINATIONS) {
    const slug = buildSlug(spec.printer, spec.material, spec.nozzle, spec.goal);

    // Load combination-specific layers.
    const printerLayer  = loadLayer(join(LAYERS_DIR, 'printers',  `${spec.printer}.yaml`));
    const materialLayer = loadLayer(join(LAYERS_DIR, 'materials', `${spec.material}.yaml`));
    const goalLayer     = loadLayer(join(LAYERS_DIR, 'goals',     `${spec.goal}.yaml`));
    const nozzleLayer   = loadLayer(join(LAYERS_DIR, 'nozzles',   nozzleLayerFile(spec.nozzle)));

    // Check for a combination override (optional).
    const overridePath = join(LAYERS_DIR, 'overrides', `${slug}.yaml`);
    const overrideLayer: LayerSchema | undefined = existsSync(overridePath)
      ? loadLayer(overridePath)
      : undefined;

    // Resolve layers in specificity order.
    const layers: LayerSchema[] = [
      globalDefaults,
      printerLayer,
      materialLayer,
      goalLayer,
      nozzleLayer,
      ...(overrideLayer !== undefined ? [overrideLayer] : []),
    ];
    const resolved = resolveLayers(layers);

    // Validate against guardrails.
    const result = validate(resolved, guardrails);
    if (!result.valid) {
      const violations = result.violations
        .map(v => `  ${v.parameter}: ${v.value} (bounds: ${v.bound.min}–${v.bound.max})`)
        .join('\n');
      console.error(`  SKIP ${slug} — guardrail violations:\n${violations}`);
      skipped++;
      continue;
    }

    // Build canonical JSON profile — source of truth for serializers.
    const canonical = buildCanonicalProfile(
      spec.printer,
      spec.material,
      spec.nozzle,
      spec.goal,
      resolved,
    );
    const canonicalSlug = canonical.metadata.slug;

    const jsonPath = join(PROFILES_DIR, `${canonicalSlug}.json`);
    writeFileSync(jsonPath, serializeCanonicalProfileToJson(canonical), 'utf-8');

    // Serialise to the appropriate slicer format.
    const slicerFormat = slicerFormatForPrinter(spec.printer);

    let downloadPath: string;
    if (slicerFormat === 'prusaslicer') {
      const ini = serializePrusaSlicer(canonical);
      const outPath = join(PRUSASLICER_DIR, `${canonicalSlug}.ini`);
      writeFileSync(outPath, ini, 'utf-8');
      downloadPath = `/profiles/prusaslicer/${canonicalSlug}.ini`;
    } else {
      const buf = serializeBambuOrca(canonical);
      const outPath = join(BAMBU_ORCA_DIR, `${canonicalSlug}.3mf`);
      writeFileSync(outPath, buf);
      downloadPath = `/profiles/bambu-orca/${canonicalSlug}.3mf`;
    }

    const highlights = HIGHLIGHTS[canonicalSlug];
    if (!highlights) {
      throw new Error(`Missing authored highlights for launch combination: ${canonicalSlug}`);
    }

    manifest.push({
      slug: canonicalSlug,
      printer: spec.printer,
      material: spec.material,
      nozzle: spec.nozzle,
      goal: spec.goal,
      isAvailable: true,
      slicerFormat,
      downloadPath,
      highlights,
    });

    console.log(`  OK   ${canonicalSlug} (${slicerFormat})`);
    built++;
  }

  // Write manifest.
  const manifestPath = join(GENERATED_DIR, 'combinations.json');
  writeFileSync(manifestPath, JSON.stringify({ combinations: manifest }, null, 2), 'utf-8');

  publishGeneratedToPublic(ROOT);

  console.log(`\nBuild complete: ${built} built, ${skipped} skipped (guardrail violations).`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Published static assets to public/ for Vite dev and production builds.`);

  if (skipped > 0) {
    process.exit(0); // Skipped combinations are logged, not a fatal error.
  }
}

run();
