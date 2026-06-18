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
