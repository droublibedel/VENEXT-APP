export const CI_CITY_SUGGESTIONS = [
  "Abidjan",
  "Bouaké",
  "Yamoussoukro",
  "San Pedro",
  "Korhogo",
  "Man",
  "Daloa",
  "Gagnoa",
  "Abobo",
  "Yopougon",
  "Adjamé",
  "Treichville",
  "Plateau",
] as const;

/** Clusters commerciaux Grand Abidjan (feed / sponsorisation géo). */
export const ABIDJAN_COMMERCIAL_CLUSTER = [
  "Abidjan",
  "Abobo",
  "Yopougon",
  "Adjamé",
  "Attécoubé",
  "Treichville",
  "Plateau",
  "Marcory",
  "Cocody",
] as const;

export function filterCiCities(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...CI_CITY_SUGGESTIONS];
  return CI_CITY_SUGGESTIONS.filter((c) => c.toLowerCase().includes(q));
}
