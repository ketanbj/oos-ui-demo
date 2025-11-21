import { simulationConfig, workloadCatalog, defaultLatencyTargets } from './config'
import { DeterministicRNG } from './rng'
import type { ControlPlane, Satellite, Workload, WorkloadPolicy } from './types'
import { degToRad, wrapDegrees, zoneForLat, nearestGroundStation } from './utils'
import { isInSunlight } from './environment'
import { kriosLatencyTargets } from '../data/latencyTargets'

const rng = new DeterministicRNG(2025)

const buildSatelliteId = (shellId: string, index: number) => `${shellId}-${String(index + 1).padStart(3, '0')}`

const generateShellSatellites = (shellId: string, altitude: number, inclination: number, count: number) => {
  const sats: Satellite[] = []
  const phaseOffset = rng.range(0, 360)
  for (let i = 0; i < count; i++) {
    const lon = wrapDegrees((i / count) * 360 + phaseOffset)
    const lat = Math.sin(degToRad(i * 6 + phaseOffset)) * (inclination * 0.5)
    const sat: Satellite = {
      id: buildSatelliteId(shellId, i),
      position: { lat, lon, alt: altitude },
      velocity: { x: rng.range(-0.2, 0.2), y: rng.range(-0.2, 0.2), z: rng.range(-0.2, 0.2) },
      battery: { current: rng.range(55, 95), rate: 0 },
      inSunlight: true,
      islLinks: [],
      groundStation: null,
      runningWorkloads: [],
      deployedComponents: [],
      zone: zoneForLat(lat),
      state: 'Healthy',
      shell: shellId,
    }
    sats.push(sat)
  }
  return sats
}

const connectISL = (sats: Satellite[]) => {
  const byShell: Record<string, Satellite[]> = {}
  for (const sat of sats) {
    byShell[sat.shell] = byShell[sat.shell] || []
    byShell[sat.shell].push(sat)
  }

  Object.values(byShell).forEach((shellSats) => {
    shellSats.sort((a, b) => a.position.lon - b.position.lon)
    const len = shellSats.length
    for (let i = 0; i < len; i++) {
      const curr = shellSats[i]
      const prev = shellSats[(i - 1 + len) % len]
      const next = shellSats[(i + 1) % len]
      curr.islLinks = [prev.id, next.id]
    }
  })
}

const assignGroundStations = (sats: Satellite[]) => {
  sats.forEach((sat) => {
    const { station } = nearestGroundStation(sat, simulationConfig.groundStations)
    sat.groundStation = station ? station.id : null
  })
}

const resolveTargets = (names: string[]) => kriosLatencyTargets.filter((t) => names.includes(t.name))

const seedWorkloadPolicy = (type: string): WorkloadPolicy => {
  switch (type) {
    case 'AI inference gateway':
      return { minBattery: 45, replicas: 3, latencyTargets: resolveTargets(defaultLatencyTargets.americas), energyPreference: 'HighBattery' }
    case 'Earth imagery pipeline':
      return { minBattery: 35, replicas: 4, latencyTargets: resolveTargets(defaultLatencyTargets.emea), energyPreference: 'Sunlight', pinRegion: 'emea' }
    case 'Communications relay':
      return { minBattery: 30, replicas: 5, latencyTargets: resolveTargets(defaultLatencyTargets.apac), energyPreference: 'Ignore' }
    case 'Batch compute lane':
      return { minBattery: 25, replicas: 3, latencyTargets: resolveTargets(defaultLatencyTargets.emea), energyPreference: 'HighBattery' }
    default:
      return { minBattery: 30, replicas: 2, latencyTargets: resolveTargets(defaultLatencyTargets.americas), energyPreference: 'Sunlight' }
  }
}

const assignWorkload = (policy: WorkloadPolicy, sats: Satellite[], workloadId: string): string[] => {
  const eligible = sats
    .filter((sat) => sat.battery.current >= policy.minBattery && (policy.pinRegion ? sat.zone === policy.pinRegion : true))
    .sort((a, b) => b.battery.current - a.battery.current)
  const assignments: string[] = []
  for (const sat of eligible) {
    if (assignments.length >= policy.replicas) break
    assignments.push(sat.id)
    sat.runningWorkloads.push(workloadId)
  }
  return assignments
}

const buildWorkloads = (sats: Satellite[]): Workload[] => {
  return workloadCatalog.map((type, idx) => {
    const policy = seedWorkloadPolicy(type)
    const id = `wl-${idx + 1}`
    const assignments = assignWorkload(policy, sats, id)
    return {
      id,
      type,
      policy,
      replicas: policy.replicas,
      assignments,
    }
  })
}

const buildControlPlane = (sats: Satellite[]): ControlPlane => {
  const sorted = [...sats].sort((a, b) => b.battery.current - a.battery.current)
  const replicas = sorted.slice(0, 7).map((s) => s.id)
  return {
    globalLiveness: 'Live',
    replicas,
    hashRoot: `root-${Math.abs(Math.floor(rng.range(1000, 9999)))}`,
  }
}

export const buildInitialState = () => {
  const satellites: Satellite[] = []
  for (const shell of simulationConfig.shells) {
    satellites.push(...generateShellSatellites(shell.id, shell.altitude, shell.inclination, shell.satellites))
  }

  connectISL(satellites)
  assignGroundStations(satellites)

  satellites.forEach((sat) => {
    sat.inSunlight = isInSunlight(0, sat)
  })

  const workloads = buildWorkloads(satellites)
  const controlPlane = buildControlPlane(satellites)

  return {
    satellites,
    workloads,
    controlPlane,
  }
}
