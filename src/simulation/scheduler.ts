import type { Satellite, SimulationDerivatives, Workload, LatencyTarget } from './types'
import { greatCircleDistance } from './utils'

const speedKmPerMs = 200 // heuristic propagation through atmosphere + routing

interface Score {
  sat: Satellite
  score: number
  latency: number
  energy: number
  resilience: number
  mobility: number
}

const latencyScore = (sat: Satellite, targets: LatencyTarget[]) => {
  if (!targets.length) return 0.6
  const scores = targets.map((target) => {
    const ground = greatCircleDistance(sat.position.lat, sat.position.lon, target.lat, target.lon)
    const pathKm = ground + sat.position.alt
    const estMs = pathKm / speedKmPerMs + 8 // base networking overhead
    const ratio = Math.max(0, 1 - estMs / target.maxMs)
    return ratio
  })
  return Math.max(...scores)
}

const computeScore = (sat: Satellite, wl: Workload): Score => {
  const latency = latencyScore(sat, wl.policy.latencyTargets)
  const energy = wl.policy.energyPreference === 'Sunlight'
    ? sat.inSunlight ? 1 : 0.4
    : wl.policy.energyPreference === 'HighBattery'
      ? sat.battery.current / 100
      : 0.7
  const resilience = 1 - (sat.state === 'Degraded' ? 0.3 : sat.state === 'Partitioned' ? 0.6 : 0)
  const mobility = 1 - Math.min(1, Math.abs(sat.position.lat) / 80)

  const score = latency * 0.35 + energy * 0.3 + resilience * 0.2 + mobility * 0.15
  return { sat, score, latency, energy, resilience, mobility }
}

export const scheduleWorkloads = (
  satellites: Satellite[],
  workloads: Workload[],
  opts?: { kriosMode?: boolean },
): SimulationDerivatives => {
  satellites.forEach((sat) => (sat.runningWorkloads = []))
  let latencyAgg = 0
  let energyAgg = 0
  let resilienceAgg = 0
  let mobilityAgg = 0
  let decisions = 0

  for (const wl of workloads) {
    const candidates = satellites.filter((sat) => sat.battery.current >= wl.policy.minBattery && sat.state !== 'Down')
    const scored = candidates.map((sat) => computeScore(sat, wl)).sort((a, b) => b.score - a.score)
    wl.assignments = []

    const limit = opts?.kriosMode ? Math.min(2, wl.policy.replicas) : wl.policy.replicas

    for (const item of scored) {
      if (wl.assignments.length >= limit) break
      wl.assignments.push(item.sat.id)
      item.sat.runningWorkloads.push(wl.id)
      latencyAgg += item.latency
      energyAgg += item.energy
      resilienceAgg += item.resilience
      mobilityAgg += item.mobility
      decisions++
    }
  }

  return {
    latencyScore: decisions ? latencyAgg / decisions : 0,
    energyScore: decisions ? energyAgg / decisions : 0,
    resilienceScore: decisions ? resilienceAgg / decisions : 0,
    mobilityScore: decisions ? mobilityAgg / decisions : 0,
  }
}
