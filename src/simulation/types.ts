export type SatelliteState = 'Healthy' | 'Degraded' | 'Partitioned' | 'Down'

export interface Satellite {
  id: string
  position: { lat: number; lon: number; alt: number }
  velocity: { x: number; y: number; z: number }
  battery: { current: number; rate: number }
  inSunlight: boolean
  islLinks: string[]
  groundStation: string | null
  runningWorkloads: string[]
  deployedComponents?: string[]
  zone: string
  state: SatelliteState
  shell: string
}

export interface LatencyTarget {
  name: string
  lat: number
  lon: number
  maxMs: number
}

export interface WorkloadPolicy {
  minBattery: number
  replicas: number
  latencyTargets: LatencyTarget[]
  energyPreference: 'HighBattery' | 'Sunlight' | 'Ignore'
  pinRegion?: string
}

export interface Workload {
  id: string
  type: string
  policy: WorkloadPolicy
  replicas: number
  assignments: string[]
}

export type ControlPlaneLiveness = 'Live' | 'Degraded' | 'Partitioned'

export interface ControlPlane {
  globalLiveness: ControlPlaneLiveness
  replicas: string[]
  hashRoot: string
}

export interface GroundStation {
  id: string
  name: string
  coordinates: { lat: number; lon: number }
}

export interface SimulationConfig {
  shells: { id: string; altitude: number; inclination: number; satellites: number }[]
  zones: string[]
  groundStations: GroundStation[]
}

export interface SimulationDerivatives {
  latencyScore: number
  energyScore: number
  resilienceScore: number
  mobilityScore: number
}

export interface SimulationSnapshot {
  satellites: Satellite[]
  workloads: Workload[]
  controlPlane: ControlPlane
  time: number
  speed: number
  derivatives: SimulationDerivatives
}

export interface ZoneHandover {
  zone: string
  active: string | null
  warm: string | null
  nextHandoverSec: number
  target: string | null
  confidence: number
}
