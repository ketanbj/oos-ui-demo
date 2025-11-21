import { simulationConfig } from './config'
import { batteryDelta, clampBattery, isInSunlight } from './environment'
import { scheduleWorkloads } from './scheduler'
import type { ControlPlane, Satellite, SimulationDerivatives, Workload } from './types'
import { nearestGroundStation, wrapDegrees, zoneForLat } from './utils'

const ORBITAL_RATE = 12 // degrees per simulated second at 1x speed

const updateControlPlane = (satellites: Satellite[], controlPlane: ControlPlane) => {
  const healthy = satellites.filter((s) => s.state === 'Healthy').length
  const degraded = satellites.filter((s) => s.state !== 'Healthy').length
  const down = satellites.filter((s) => s.state === 'Down').length
  const healthRatio = healthy / satellites.length
  if (down > satellites.length * 0.15 || healthRatio < 0.4) controlPlane.globalLiveness = 'Partitioned'
  else if (degraded > satellites.length * 0.2) controlPlane.globalLiveness = 'Degraded'
  else controlPlane.globalLiveness = 'Live'

  if (controlPlane.replicas.length < 5) {
    const candidates = satellites
      .filter((s) => s.state === 'Healthy')
      .sort((a, b) => b.battery.current - a.battery.current)
      .slice(0, 7)
      .map((s) => s.id)
    controlPlane.replicas = candidates
  }
  controlPlane.hashRoot = `root-${controlPlane.replicas.length}-${Math.round(healthRatio * 100)}`
}

const updateSatellitePosition = (sat: Satellite, delta: number, speed: number, time: number) => {
  if (sat.state === 'Down') return
  sat.position.lon = wrapDegrees(sat.position.lon + delta * speed * ORBITAL_RATE)
  sat.position.lat = Math.sin((time * 0.07 + sat.velocity.x) + sat.position.lon * 0.02) * 0.8 * 90
  sat.zone = zoneForLat(sat.position.lat)
  const { station } = nearestGroundStation(sat, simulationConfig.groundStations)
  sat.groundStation = station ? station.id : null
}

const updatePower = (sat: Satellite, time: number, deltaSeconds: number, speed: number, energyBudget: boolean) => {
  if (sat.state === 'Down') {
    // keep dead satellites visibly down; let battery trickle off for realism
    sat.battery.rate = -5
    sat.battery.current = clampBattery(sat.battery.current - 0.2 * deltaSeconds * speed)
    return
  }
  const sunlight = isInSunlight(time, sat)
  sat.inSunlight = sunlight
  const delta = batteryDelta(sat, sunlight, energyBudget)
  sat.battery.rate = delta * 100
  sat.battery.current = clampBattery(sat.battery.current + delta * 100 * deltaSeconds * speed * 0.6)
  if (sat.battery.current < 10) sat.state = 'Partitioned'
  else if (sat.battery.current < 15) sat.state = 'Degraded'
  else sat.state = 'Healthy'
}

export const advanceSimulation = (
  satellites: Satellite[],
  workloads: Workload[],
  controlPlane: ControlPlane,
  deltaSeconds: number,
  speed: number,
  time: number,
  opts?: { kriosMode?: boolean; energyBudget?: boolean },
): SimulationDerivatives => {
  satellites.forEach((sat) => updateSatellitePosition(sat, deltaSeconds, speed, time))
  satellites.forEach((sat) => updatePower(sat, time, deltaSeconds, speed, opts?.energyBudget ?? false))
  const derivatives = scheduleWorkloads(satellites, workloads, { kriosMode: opts?.kriosMode })
  updateControlPlane(satellites, controlPlane)
  return derivatives
}
