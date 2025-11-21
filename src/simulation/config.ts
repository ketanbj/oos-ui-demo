import type { SimulationConfig } from './types'

export const simulationConfig: SimulationConfig = {
  shells: [
    { id: 'starlink-53', altitude: 550, inclination: 53, satellites: 48 },
    { id: 'starlink-polar', altitude: 570, inclination: 97.6, satellites: 24 },
    { id: 'oneweb-87', altitude: 1200, inclination: 87.9, satellites: 24 },
    { id: 'planet-ss', altitude: 475, inclination: 98, satellites: 30 },
  ],
  zones: ['americas', 'emea', 'apac'],
  groundStations: [
    { id: 'gs-sea', name: 'Seattle', coordinates: { lat: 47.6062, lon: -122.3321 } },
    { id: 'gs-gdl', name: 'Guadalajara', coordinates: { lat: 20.6597, lon: -103.3496 } },
    { id: 'gs-lhr', name: 'London', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { id: 'gs-dxb', name: 'Dubai', coordinates: { lat: 25.2048, lon: 55.2708 } },
    { id: 'gs-syd', name: 'Sydney', coordinates: { lat: -33.8688, lon: 151.2093 } },
  ],
}

export const workloadCatalog = [
  'AI inference gateway',
  'Earth imagery pipeline',
  'Communications relay',
  'Batch compute lane',
  'Custom app',
]

export const defaultLatencyTargets = {
  americas: ['Seattle', 'Sao Paulo'],
  emea: ['London', 'Dubai'],
  apac: ['Singapore', 'Tokyo'],
}

export const defaultZones = ['americas', 'emea', 'apac']
