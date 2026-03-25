export type EmissionUnit = "kg/hr" | "kg/day" | "tonnes/year" | "CO2e/hr";

const GWP_CH4 = 28;

const CONVERSIONS: Record<EmissionUnit, (kgPerHr: number) => number> = {
  "kg/hr": (v) => v,
  "kg/day": (v) => v * 24,
  "tonnes/year": (v) => (v * 24 * 365) / 1000,
  "CO2e/hr": (v) => v * GWP_CH4,
};

export function convertEmission(valueKgPerHr: number, targetUnit: EmissionUnit): number {
  return CONVERSIONS[targetUnit](valueKgPerHr);
}

export function formatEmission(valueKgPerHr: number, targetUnit: EmissionUnit, decimals = 2): string {
  const converted = convertEmission(valueKgPerHr, targetUnit);
  if (converted >= 1_000_000) return `${(converted / 1_000_000).toFixed(decimals)}M`;
  if (converted >= 1_000) return `${(converted / 1_000).toFixed(decimals)}K`;
  return converted.toFixed(decimals);
}

export function getUnitLabel(unit: EmissionUnit): string {
  return unit;
}

export const EMISSION_UNITS: EmissionUnit[] = ["kg/hr", "kg/day", "tonnes/year", "CO2e/hr"];
