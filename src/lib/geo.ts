// Offline city→coordinates lookup for imports (no external geocoder needed).
// Covers the Dutch cities most relevant to a northern-NL portfolio plus the
// largest national ones; extend freely. Deterministic jitter spreads multiple
// properties in the same city so map pins don't stack exactly.

const CITY_COORDS: Record<string, [number, number]> = {
  leeuwarden: [53.2012, 5.7999],
  dokkum: [53.326, 5.998],
  drachten: [53.1122, 6.0989],
  sneek: [53.033, 5.6589],
  heerenveen: [52.9602, 5.9195],
  harlingen: [53.1736, 5.4207],
  franeker: [53.1867, 5.5404],
  joure: [52.9633, 5.8051],
  bolsward: [53.0644, 5.5237],
  burgum: [53.1926, 5.9931],
  groningen: [53.2194, 6.5665],
  assen: [52.9925, 6.5649],
  emmen: [52.7792, 6.9069],
  zwolle: [52.5168, 6.083],
  meppel: [52.6951, 6.1944],
  hoogeveen: [52.7221, 6.4866],
  kampen: [52.555, 5.9114],
  lelystad: [52.5185, 5.4714],
  amsterdam: [52.3676, 4.9041],
  rotterdam: [51.9244, 4.4777],
  "den haag": [52.0705, 4.3007],
  utrecht: [52.0907, 5.1214],
  eindhoven: [51.4416, 5.4697],
  tilburg: [51.5555, 5.0913],
  almere: [52.3508, 5.2647],
  breda: [51.5719, 4.7683],
  nijmegen: [51.8126, 5.8372],
  apeldoorn: [52.2112, 5.9699],
  arnhem: [51.9851, 5.8987],
  haarlem: [52.3874, 4.6462],
  enschede: [52.2215, 6.8937],
  amersfoort: [52.1561, 5.3878],
  zaandam: [52.4389, 4.8258],
  hilversum: [52.2292, 5.1669],
  maastricht: [50.8514, 5.691],
  alkmaar: [52.6324, 4.7534],
  deventer: [52.2661, 6.1552],
  delft: [52.0116, 4.3571],
  leiden: [52.1601, 4.497],
};

/** Small deterministic hash → [-0.5, 0.5). */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

/**
 * Approximate coordinates for a Dutch city, jittered deterministically by a
 * seed (e.g. the street address) within ~±0.015° (~1.5 km).
 */
export function cityCoords(city: string, seed = ""): { lat: number; lng: number } | null {
  const base = CITY_COORDS[city.trim().toLowerCase()];
  if (!base) return null;
  return {
    lat: base[0] + hash01(`${seed}|lat`) * 0.03,
    lng: base[1] + hash01(`${seed}|lng`) * 0.05,
  };
}
