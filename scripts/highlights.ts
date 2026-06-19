/**
 * Plain-English highlight sentences for each launch combination.
 * Authored in S-3.5 — one sentence per highlight, non-expert audience.
 * Each set covers three distinct parameter decisions with no overlap.
 */

export type HighlightSet = [string, string, string];

/** Canonical slug → three highlight sentences shown on the profile page. */
export const HIGHLIGHTS: Record<string, HighlightSet> = {
  'bambu-a1-mini-pla-04mm-balanced': [
    'Print speed is set to 200mm/s — fast enough for the A1 Mini\'s CoreXY motion system while staying within tested limits for consistent quality.',
    'Layer height is 0.2mm with 15% gyroid infill — the standard balanced setup for everyday PLA prints that need reasonable strength without long print times.',
    'Nozzle temperature is 215°C with full cooling from layer 2 — PLA needs active fan to produce clean overhangs and bridges.',
  ],
  'bambu-a1-mini-pla-06mm-balanced': [
    'The 0.6mm nozzle allows a wider 0.68mm line width, so each layer deposits more material and prints finish faster than with a 0.4mm nozzle.',
    'Print speed stays at 200mm/s — the larger bore supports higher volumetric flow, so you get speed gains without pushing the hotend beyond its safe limit.',
    'Nozzle temperature is 215°C with full cooling from layer 2 — PLA still needs strong fan even with the larger nozzle to prevent sagging on overhangs.',
  ],
  'bambu-a1-mini-petg-04mm-balanced': [
    'Nozzle temperature is 240°C — the mid-range for PETG that works across most filament brands without risking heat creep or stringing.',
    'Fan speed is capped at 50% from layer 3 — PETG layers bond poorly when over-cooled, so this profile keeps enough heat for strong layer adhesion.',
    'Bed temperature is 80°C — warm enough for PETG to stick to PEI without bonding so aggressively that removal damages the sheet.',
  ],
  'bambu-a1-mini-petg-06mm-balanced': [
    'The 0.6mm nozzle is ideal for functional PETG parts where layer strength matters more than fine surface detail.',
    'Fan speed is capped at 50% from layer 3 — the larger nozzle deposits more material per layer, so reduced cooling prevents layer separation.',
    'Print speed is 200mm/s with a 240°C nozzle — PETG tolerates moderate speed when temperatures and cooling are kept in balance.',
  ],
  'bambu-x1c-pla-04mm-balanced': [
    'Print speed is set to 250mm/s — the X1C\'s rigid frame and vibration compensation allow higher balanced speeds than smaller Bambu printers.',
    'Layer height is 0.2mm with 15% gyroid infill — a reliable default for PLA parts that balances print time against surface quality.',
    'Bed temperature is 55°C with a 60°C first layer — slightly warmer on layer one improves adhesion without heat-creeping PLA off the sheet.',
  ],
  'bambu-x1c-pla-06mm-balanced': [
    'The 0.6mm nozzle trades fine detail for throughput — each pass lays down more plastic, shortening print time on larger PLA parts.',
    'Print speed is 250mm/s — the X1C\'s CoreXY motion system handles the higher volumetric demand of a 0.6mm nozzle at this speed.',
    'Nozzle temperature is 215°C with full cooling from layer 2 — PLA needs active fan regardless of nozzle size to keep overhangs crisp.',
  ],
  'bambu-x1c-petg-04mm-balanced': [
    'Print speed is 250mm/s — the X1C can sustain higher PETG speeds than bed-slinger printers because the moving mass stays on the gantry.',
    'Fan speed is limited to 50% — PETG becomes brittle and layers can separate if cooled too aggressively, especially on the first few layers.',
    'Bed temperature is 80°C with an 85°C first layer — warm enough for reliable PETG adhesion on PEI without over-bonding to smooth surfaces.',
  ],
  'bambu-x1c-petg-06mm-balanced': [
    'The 0.6mm nozzle produces stronger layer bonds for PETG functional parts where durability matters more than surface finish.',
    'Nozzle temperature is 240°C with fan capped at 50% — PETG needs warmth to fuse each layer, and the larger nozzle deposits enough material to benefit from moderate speed.',
    'Print speed is 250mm/s — conservative for the X1C but appropriate for PETG, where pushing too fast risks poor layer adhesion.',
  ],
  'prusa-mk4-pla-04mm-balanced': [
    'Print speed is 150mm/s — a conservative balanced value that works reliably on the MK4 whether or not input shaping is enabled.',
    'First layer speed is 25mm/s — slow enough for the Nextruder to lay down a smooth foundation before the print accelerates.',
    'Nozzle temperature is 215°C with 100% fan from layer 2 — standard PLA settings tuned for the MK4\'s direct-drive extruder.',
  ],
  'prusa-mk4-pla-06mm-balanced': [
    'The 0.6mm nozzle increases line width to 0.68mm — each layer carries more material, reducing total print time on larger PLA jobs.',
    'Print speed is 150mm/s — kept moderate because the MK4\'s bed-slinger design can ring at higher speeds without input shaping calibration.',
    'Retraction is 0.8mm at 45mm/s — short retractions suit the MK4\'s direct-drive Nextruder and prevent PLA heat creep in the hotend.',
  ],
  'prusa-mk4-petg-04mm-balanced': [
    'Nozzle temperature is 240°C — the safe mid-range for PETG that avoids both under-extrusion and excessive stringing on the MK4.',
    'Fan speed is capped at 50% starting from layer 3 — the first two layers print without fan so PETG can bond firmly to the bed.',
    'Print speed is 150mm/s — moderate speed gives PETG enough time to fuse between layers on a bed-slinger where the part moves during printing.',
  ],
  'prusa-mk4-petg-06mm-balanced': [
    'The 0.6mm nozzle is suited to structural PETG parts — wider lines produce stronger walls with fewer perimeters needed.',
    'Bed temperature is 80°C — PETG needs a warmer bed than PLA, and 80°C is the sweet spot for PEI adhesion without sheet damage.',
    'Retraction is 0.8mm at 40mm/s — PETG strings more than PLA but clogs easily with long retractions, so this profile uses a cautious distance.',
  ],
  'creality-ender-3-v3-se-pla-04mm-balanced': [
    'Print speed is 100mm/s — kept below the ringing threshold for the Ender 3 V3 SE, which has no input shaping to dampen vibration artefacts.',
    'External perimeter speed is 50mm/s — slower outer walls produce cleaner surfaces on this Cartesian bed-slinger at the cost of slightly longer print time.',
    'Nozzle temperature is 215°C with full cooling from layer 2 — PLA needs strong fan on the Sprite direct-drive extruder to prevent stringing on travels.',
  ],
  'creality-ender-3-v3-se-pla-06mm-balanced': [
    'The 0.6mm nozzle compensates for the Ender 3\'s moderate print speed — wider lines mean fewer passes are needed to fill each layer.',
    'Print speed is 100mm/s — the maximum reliable speed for this printer without input shaping, avoiding visible ringing on inner and outer walls.',
    'Layer height is 0.2mm with 15% gyroid infill — a practical balanced setup for functional PLA parts on a machine tuned for reliability over raw speed.',
  ],
  'creality-ender-3-v3-se-petg-04mm-balanced': [
    'Print speed is 100mm/s — PETG on a bed-slinger needs moderate speed so layers fuse before the moving bed introduces vibration.',
    'Fan speed is capped at 50% from layer 3 — cooling PETG too much on the Ender 3 causes layer delamination, especially on taller prints.',
    'Bed temperature is 80°C with an 85°C first layer — warm enough for PETG to grip the CR Touch-levelled bed without warping corners.',
  ],
  'creality-ender-3-v3-se-petg-06mm-balanced': [
    'The 0.6mm nozzle helps PETG parts finish faster on a printer limited to 100mm/s — each layer deposits more material per pass.',
    'Nozzle temperature is 240°C — mid-range PETG heat that accounts for the Ender 3\'s stock hotend, which can struggle with very high flow rates.',
    'Fan speed is capped at 50% — the first two layers print without fan to ensure PETG bonds securely before any cooling begins.',
  ],
  'creality-k1-pla-04mm-balanced': [
    'Print speed is 200mm/s — the K1\'s CoreXY Klipper firmware supports high balanced speeds once input shaping is calibrated.',
    'Layer height is 0.2mm with 15% gyroid infill — a dependable default for everyday PLA prints on a high-speed machine.',
    'First layer speed is 30mm/s — a cautious start that gives the K1\'s auto-levelling system time to establish a solid foundation.',
  ],
  'creality-k1-pla-06mm-balanced': [
    'The 0.6mm nozzle pairs well with the K1\'s speed — wider lines let the CoreXY motion system deliver meaningful time savings on large PLA prints.',
    'Print speed is 200mm/s — conservative for the K1 but safe for PLA through a 0.6mm nozzle without exceeding volumetric limits.',
    'Nozzle temperature is 215°C with full cooling from layer 2 — PLA needs active fan even on high-speed printers to keep overhangs clean.',
  ],
  'creality-k1-petg-04mm-balanced': [
    'Print speed is 200mm/s — the K1\'s CoreXY design can move faster than bed-slingers, but PETG speed is capped to protect layer adhesion.',
    'Fan speed is limited to 50% from layer 3 — PETG on a high-speed printer still needs warmth between layers to fuse properly.',
    'Bed temperature is 80°C — warm enough for PETG to stick to the K1\'s textured PEI surface without over-bonding during long prints.',
  ],
  'creality-k1-petg-06mm-balanced': [
    'The 0.6mm nozzle is recommended for functional PETG parts on the K1 — wider lines add strength where the printer\'s speed already saves time.',
    'Nozzle temperature is 240°C with fan capped at 50% — PETG needs consistent heat through the larger bore to avoid under-extrusion at 200mm/s.',
    'First layer speed is 30mm/s — a slow first layer ensures PETG adheres before the print accelerates to full speed.',
  ],
};
