import { PRINTERS, MATERIALS, NOZZLE_SIZES, isGoalSelectable } from '../types';

/** Validated configure form values parsed from URL query parameters. */
export type ParsedConfigureParams = {
  printer?: string;
  material?: string;
  nozzle?: string;
  goal?: string;
};

function isKnownPrinter(value: string): boolean {
  return PRINTERS.some(printer => printer.id === value);
}

function isKnownMaterial(value: string): boolean {
  return MATERIALS.some(material => material.id === value);
}

function isKnownNozzle(value: string): boolean {
  return NOZZLE_SIZES.some(nozzle => nozzle.id === value);
}

function isKnownGoal(value: string): boolean {
  return isGoalSelectable(value);
}

/**
 * Parses `/configure` query parameters into validated form values.
 * Unknown or missing values are omitted — never coerced or defaulted.
 * Sole implementation of URL param parsing for the configure form (S-3.9).
 */
export function parseConfigureParams(searchParams: URLSearchParams): ParsedConfigureParams {
  const result: ParsedConfigureParams = {};

  const printer = searchParams.get('printer');
  if (printer !== null && isKnownPrinter(printer)) {
    result.printer = printer;
  }

  const material = searchParams.get('material');
  if (material !== null && isKnownMaterial(material)) {
    result.material = material;
  }

  const nozzle = searchParams.get('nozzle');
  if (nozzle !== null && isKnownNozzle(nozzle)) {
    result.nozzle = nozzle;
  }

  const goal = searchParams.get('goal');
  if (goal !== null && isKnownGoal(goal)) {
    result.goal = goal;
  }

  return result;
}
