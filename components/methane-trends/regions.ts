/**
 * Nigeria geopolitical zone (region) mapping. Mirrors the mapping inside
 * `live-map/boundaryLayers.ts` so the Methane Trends screens stay independent.
 */

export const STATE_ZONES: Record<string, string> = {
  'Abia': 'South East', 'Adamawa': 'North East', 'Akwa Ibom': 'South South',
  'Anambra': 'South East', 'Bauchi': 'North East', 'Bayelsa': 'South South',
  'Benue': 'North Central', 'Borno': 'North East', 'Cross River': 'South South',
  'Delta': 'South South', 'Ebonyi': 'South East', 'Edo': 'South South',
  'Ekiti': 'South West', 'Enugu': 'South East', 'Federal Capital Territory': 'North Central',
  'Gombe': 'North East', 'Imo': 'South East', 'Jigawa': 'North West',
  'Kaduna': 'North West', 'Kano': 'North West', 'Katsina': 'North West',
  'Kebbi': 'North West', 'Kogi': 'North Central', 'Kwara': 'North Central',
  'Lagos': 'South West', 'Nasarawa': 'North Central', 'Niger': 'North Central',
  'Ogun': 'South West', 'Ondo': 'South West', 'Osun': 'South West',
  'Oyo': 'South West', 'Plateau': 'North Central', 'Rivers': 'South South',
  'Sokoto': 'North West', 'Taraba': 'North East', 'Yobe': 'North East',
  'Zamfara': 'North West',
};

/** Tolerant lookup — accepts state names with extra suffixes / casing differences. */
export function getRegionForState(stateName: string | null | undefined): string | null {
  if (!stateName) return null;
  const lower = stateName.trim().toLowerCase();
  for (const [key, zone] of Object.entries(STATE_ZONES)) {
    if (lower === key.toLowerCase() || lower.includes(key.toLowerCase())) return zone;
  }
  return null;
}
