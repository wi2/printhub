export type Printer = {
  id: string;
  name: string;
  manufacturer: string;
  defaultSlicerFormat: string;
};

export type Material = {
  id: string;
  name: string;
};

export type NozzleSize = {
  id: string;
  label: string;
};

export type PrintGoal = {
  id: string;
  name: string;
  description: string;
};

export type SlicerFormat = {
  id: string;
  name: string;
  fileExtension: string;
};

export const PRINTERS = [
  { id: 'bambu-a1-mini',          name: 'Bambu Lab A1 Mini',       manufacturer: 'Bambu Lab',      defaultSlicerFormat: 'bambu-orca'  },
  { id: 'bambu-x1c',              name: 'Bambu Lab X1C',           manufacturer: 'Bambu Lab',      defaultSlicerFormat: 'bambu-orca'  },
  { id: 'prusa-mk4',              name: 'Prusa MK4',               manufacturer: 'Prusa Research', defaultSlicerFormat: 'prusaslicer' },
  { id: 'creality-ender-3-v3-se', name: 'Creality Ender 3 V3 SE', manufacturer: 'Creality',       defaultSlicerFormat: 'prusaslicer' },
  { id: 'creality-k1',            name: 'Creality K1',             manufacturer: 'Creality',       defaultSlicerFormat: 'bambu-orca'  },
] as const satisfies Printer[];

export const MATERIALS = [
  { id: 'pla',  name: 'PLA'       },
  { id: 'petg', name: 'PETG'      },
  { id: 'tpu',  name: 'TPU (95A)' },
] as const satisfies Material[];

export const NOZZLE_SIZES = [
  { id: '0.4', label: '0.4mm' },
  { id: '0.6', label: '0.6mm' },
] as const satisfies NozzleSize[];

export const GOALS = [
  { id: 'balanced', name: 'Balanced', description: 'Good quality and reasonable print time. Good for most prints.'     },
  { id: 'quality',  name: 'Quality',  description: 'Best surface finish. Slower print time. Good for display pieces.' },
] as const satisfies PrintGoal[];

/** Goal IDs defined in GOALS that are not yet selectable in the configure form. */
export const UNAVAILABLE_GOAL_IDS: readonly string[] = ['quality'];

/**
 * Returns true when a goal id is known and currently selectable in the UI.
 * Unavailable goals remain in GOALS but render as disabled "coming soon" options.
 */
export function isGoalSelectable(goalId: string): boolean {
  return GOALS.some(goal => goal.id === goalId) && !UNAVAILABLE_GOAL_IDS.includes(goalId);
}

export const SLICER_FORMATS = [
  { id: 'prusaslicer', name: 'PrusaSlicer',                fileExtension: '.ini'  },
  { id: 'bambu-orca',  name: 'Bambu Studio / Orca Slicer', fileExtension: '.3mf'  },
] as const satisfies SlicerFormat[];

export type ManifestEntry = {
  slug: string;
  printer: string;
  material: string;
  nozzle: string;
  goal: string;
  isAvailable: boolean;
  slicerFormat: string;
  downloadPath: string;
  highlights: [string, string, string];
};

export type Manifest = {
  combinations: ManifestEntry[];
};

/**
 * A validated printer + material + nozzle + goal tuple.
 * isAvailable is false until the combination has passed a physical test print.
 * slug is the canonical URL key: "[printer]-[material]-[nozzle]-[goal]".
 */
export type Combination = {
  printer: string;
  material: string;
  nozzle: string;
  goal: string;
  isAvailable: boolean;
  slug: string;
};

/**
 * The downloadable slicer file produced for a combination.
 * filename follows the pattern "[slug].[ext]" (e.g. "bambu-a1-mini-pla-04mm-balanced.ini").
 */
export type ProfileFile = {
  slicerFormat: string;
  downloadPath: string;
  filename: string;
};

/**
 * The result page data for a validated combination.
 * highlights is always a fixed-length tuple of three plain-English sentences.
 * confidenceCount is the number of successful print reports; fetched via the stats API.
 */
export type Profile = {
  slug: string;
  highlights: [string, string, string];
  confidenceCount: number;
  slicerFormat: string;
  profileFile: ProfileFile;
};

/** Valid outcome values for a feedback submission. Source: S-4.1 and S-4.2 AC. */
export type FeedbackOutcome = 'success' | 'failure' | 'pending';

/**
 * A single anonymous feedback submission stored against a combination slug.
 * failureReasons is an empty array when outcome is not "failure".
 */
export type FeedbackSession = {
  slug: string;
  outcome: FeedbackOutcome;
  failureReasons: string[];
  submittedAt: string;
};

/**
 * Slicer-specific import instructions shown to the user after download.
 * One ImportGuide exists per supported SlicerFormat.
 * steps are ordered; tip is the inline slicer-specific note from the spec.
 */
export type ImportGuide = {
  slicerFormat: string;
  steps: string[];
  tip: string;
};
