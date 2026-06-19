import type { ImportGuide } from '../../types';

/**
 * Slicer-specific import instructions from mvp-spec.md Stage 4.
 * One guide per supported slicer format — not per printer.
 */
export const IMPORT_GUIDES: Record<string, ImportGuide> = {
  'bambu-orca': {
    slicerFormat: 'bambu-orca',
    steps: [
      'Open Bambu Studio',
      'Click File → Import → Import Configs…',
      'Select the file you just downloaded',
      'Click OK when prompted to confirm the import',
      'In the top bar, open the Filament dropdown and select the imported filament profile',
      'Open the Process dropdown and select the imported process profile',
      'Slice your model as normal',
    ],
    tip: 'The imported profile is not the same as the built-in Bambu filament profiles. Do not mix them. Use the imported profile for this material/goal only.',
  },
  prusaslicer: {
    slicerFormat: 'prusaslicer',
    steps: [
      'Open PrusaSlicer',
      'Click File → Import → Import Config Bundle…',
      'Select the file you just downloaded',
      'The profile will appear in your Print Settings, Filament Settings, and Printer dropdowns',
      'Select all three before slicing',
    ],
    tip: 'Use the imported Print Settings, Filament Settings, and Printer profiles together — mixing one imported profile with built-in defaults can produce unexpected results.',
  },
};

/**
 * Returns the import guide for a slicer format, or undefined for unknown formats.
 */
export function getImportGuide(slicerFormat: string): ImportGuide | undefined {
  return IMPORT_GUIDES[slicerFormat];
}
