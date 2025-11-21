import { scheduleWorkloads } from './scheduler'
import type { ControlPlane, Satellite, Workload } from './types'

export interface OutageView {
  satellites: Satellite[]
  workloads: Workload[]
  controlPlane: ControlPlane
  title: string
  failedWorkloads: string[]
  blastRadius: number
}

const cloneSatellites = (sats: Satellite[]) => sats.map((s) => ({ ...s, battery: { ...s.battery }, islLinks: [...s.islLinks], runningWorkloads: [...s.runningWorkloads] }))
const cloneWorkloads = (wls: Workload[]) => wls.map((w) => ({ ...w, assignments: [...w.assignments], policy: { ...w.policy } }))

const pickPlane = (sats: Satellite[], fraction: number) => {
  const shells = Array.from(new Set(sats.map((s) => s.shell)))
  const shell = shells[0]
  const shellSats = sats.filter((s) => s.shell === shell)
  const sorted = [...shellSats].sort((a, b) => a.position.lon - b.position.lon)
  const slice = sorted.slice(0, Math.max(10, Math.floor(sorted.length * fraction)))
  return { shell, slice }
}

const dropGroundStations = (sats: Satellite[], count: number) => {
  const affected = new Set<string>()
  for (const sat of sats) {
    if (!sat.groundStation) continue
    if (affected.size >= count) break
    affected.add(sat.groundStation)
  }
  sats.forEach((sat) => {
    if (sat.groundStation && affected.has(sat.groundStation)) {
      sat.groundStation = null
      sat.state = 'Partitioned'
    }
  })
}

const relinkShell = (sats: Satellite[], shell: string) => {
  const survivors = sats.filter((s) => s.shell === shell && s.state !== 'Down').sort((a, b) => a.position.lon - b.position.lon)
  const len = survivors.length
  for (let i = 0; i < len; i++) {
    const prev = survivors[(i - 1 + len) % len]
    const next = survivors[(i + 1) % len]
    survivors[i].islLinks = [prev.id, next.id]
  }
}

const markFailures = (sats: Satellite[], withOrbital: boolean) => {
  const { shell, slice } = pickPlane(sats, withOrbital ? 0.25 : 0.6)
  slice.forEach((sat) => {
    sat.state = 'Down'
    sat.islLinks = []
    sat.runningWorkloads = []
    sat.groundStation = null
  })

  const downSet = new Set(slice.map((s) => s.id))
  sats.forEach((sat) => {
    sat.islLinks = sat.islLinks.filter((peer) => !downSet.has(peer))
    if (!withOrbital && sat.state !== 'Down' && Math.random() < 0.1) {
      sat.state = 'Partitioned'
    }
    if (withOrbital && sat.state !== 'Down') {
      sat.state = 'Healthy'
    }
  })

  if (withOrbital) {
    relinkShell(sats, shell)
  }
  return slice.map((s) => s.id)
}

export const outagePerspective = (
  satellites: Satellite[],
  workloads: Workload[],
  controlPlane: ControlPlane,
  withOrbital: boolean,
): OutageView => {
  const satCopy = cloneSatellites(satellites)
  const wlCopy = cloneWorkloads(workloads)
  const affected = markFailures(satCopy, withOrbital)
  dropGroundStations(satCopy, withOrbital ? 1 : 2)

  let blastRadius = affected.length / satCopy.length
  const failedWorkloads: string[] = []
  wlCopy.forEach((wl) => {
    wl.assignments = wl.assignments.filter((id) => !affected.includes(id))
    if (!withOrbital && wl.assignments.length < wl.policy.replicas) {
      failedWorkloads.push(wl.id)
    }
  })

  const cp: ControlPlane = {
    ...controlPlane,
    replicas: controlPlane.replicas.filter((id) => !affected.includes(id)),
    globalLiveness: withOrbital ? 'Live' : 'Partitioned',
  }

  if (withOrbital) {
    scheduleWorkloads(satCopy, wlCopy)
    blastRadius = Math.max(0.12, blastRadius * 0.35)
    cp.globalLiveness = 'Live'
  } else {
    blastRadius = Math.min(0.9, blastRadius + 0.15)
    wlCopy.forEach((wl) => {
      wl.assignments = wl.assignments.filter((id) => !affected.includes(id))
    })
    cp.globalLiveness = 'Partitioned'
  }

  return {
    satellites: satCopy,
    workloads: wlCopy,
    controlPlane: cp,
    title: withOrbital ? 'With Orbital OS' : 'Without Orbital OS',
    failedWorkloads,
    blastRadius,
  }
}
