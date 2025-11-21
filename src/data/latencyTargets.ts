import type { LatencyTarget } from '../simulation/types'

export const kriosLatencyTargets: LatencyTarget[] = [
  { name: 'Seattle', lat: 47.6062, lon: -122.3321, maxMs: 60 },
  { name: 'London', lat: 51.5074, lon: -0.1278, maxMs: 70 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, maxMs: 80 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, maxMs: 85 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, maxMs: 70 },
  { name: 'Sao Paulo', lat: -23.55, lon: -46.6333, maxMs: 90 },
]
