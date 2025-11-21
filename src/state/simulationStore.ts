import { create } from 'zustand'
import { advanceSimulation } from '../simulation/engine'
import { buildInitialState } from '../simulation/initialState'
import { outagePerspective } from '../simulation/outage'
import { simulationConfig } from '../simulation/config'
import type { ControlPlane, Satellite, SimulationDerivatives, Workload, ZoneHandover } from '../simulation/types'
import { computeZoneHandovers } from '../simulation/handovers'

interface LayerFilters {
  shells: string[]
  zones: string[]
  layers: {
    isl: boolean
    energy: boolean
    workloads: boolean
    heatmap: boolean
  }
}

interface SimulationStore {
  satellites: Satellite[]
  workloads: Workload[]
  controlPlane: ControlPlane
  time: number
  speed: number
  paused: boolean
  derivatives: SimulationDerivatives
  filters: LayerFilters
  handovers: ZoneHandover[]
  modes: {
    kriosPrewarm: boolean
    starloomFederation: boolean
    energyBudget: boolean
  }
  operator: {
    tle: string
    deploymentImage: string
    deploymentStatus: 'idle' | 'deploying' | 'done'
    deploymentTargets: string[]
    customZones: string[]
  }
  setSpeed: (speed: number) => void
  togglePause: () => void
  step: (deltaSeconds: number) => void
  stepOnce: (deltaSeconds: number) => void
  toggleLayer: (layer: keyof LayerFilters['layers']) => void
  setShells: (shellIds: string[]) => void
  setZones: (zones: string[]) => void
  toggleMode: (mode: keyof SimulationStore['modes']) => void
  injectFailure: (scope: 'plane' | 'gs' | 'battery') => void
  updateWorkloadPolicy: (id: string, updates: Partial<Workload['policy']>) => void
  adjustShellAltitude: (delta: number) => void
  nudgeGroundStations: (lonDelta: number) => void
  setTle: (text: string) => void
  deployImage: (image: string) => void
  setCustomZones: (zones: string[]) => void
  reset: () => void
  outageViews: () => { noOs: ReturnType<typeof outagePerspective>; withOs: ReturnType<typeof outagePerspective> }
}

const initial = buildInitialState()

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initial,
  time: 0,
  speed: 1,
  paused: false,
  derivatives: { latencyScore: 0.8, energyScore: 0.7, resilienceScore: 0.75, mobilityScore: 0.7 },
  handovers: [],
  modes: { kriosPrewarm: false, starloomFederation: false, energyBudget: false },
  operator: { tle: '', deploymentImage: '', deploymentStatus: 'idle', deploymentTargets: [], customZones: [] },
  filters: {
    shells: simulationConfig.shells.map((s) => s.id),
    zones: simulationConfig.zones,
    layers: { isl: true, energy: true, workloads: true, heatmap: false },
  },
  setSpeed: (speed) => set({ speed }),
  togglePause: () => set((state) => ({ paused: !state.paused })),
  step: (deltaSeconds) => {
    const { paused, speed } = get()
    if (paused) return
    set((state) => {
      const derivatives = advanceSimulation(state.satellites, state.workloads, state.controlPlane, deltaSeconds, speed, state.time, {
        kriosMode: state.modes.kriosPrewarm,
        energyBudget: state.modes.energyBudget,
      })
      return {
        time: state.time + deltaSeconds * speed,
        derivatives,
        satellites: [...state.satellites],
        workloads: [...state.workloads],
        controlPlane: { ...state.controlPlane },
        handovers: computeZoneHandovers(state.satellites, { leadTime: 30, zones: state.filters.zones }),
      }
    })
  },
  stepOnce: (deltaSeconds) => {
    const { speed } = get()
    set((state) => {
      const derivatives = advanceSimulation(state.satellites, state.workloads, state.controlPlane, deltaSeconds, speed, state.time, {
        kriosMode: state.modes.kriosPrewarm,
        energyBudget: state.modes.energyBudget,
      })
      return {
        time: state.time + deltaSeconds * speed,
        derivatives,
        satellites: [...state.satellites],
        workloads: [...state.workloads],
        controlPlane: { ...state.controlPlane },
        handovers: computeZoneHandovers(state.satellites, { leadTime: 30, zones: state.filters.zones }),
      }
    })
  },
  toggleLayer: (layer) => set((state) => ({ filters: { ...state.filters, layers: { ...state.filters.layers, [layer]: !state.filters.layers[layer] } } })),
  setShells: (shellIds) => set((state) => ({ filters: { ...state.filters, shells: shellIds } })),
  setZones: (zones) => set((state) => ({ filters: { ...state.filters, zones } })),
  toggleMode: (mode) => set((state) => ({ modes: { ...state.modes, [mode]: !state.modes[mode] } })),
  injectFailure: (scope) =>
    set((state) => {
      const satellites = state.satellites.map((sat) => ({
        ...sat,
        battery: { ...sat.battery },
        islLinks: [...sat.islLinks],
        runningWorkloads: [...sat.runningWorkloads],
      }))

      let controlPlane = { ...state.controlPlane }

      if (scope === 'plane') {
        // pick the largest shell so the blast is visually obvious
        const shellCounts: Record<string, number> = {}
        satellites.forEach((s) => {
          shellCounts[s.shell] = (shellCounts[s.shell] || 0) + 1
        })
        const targetShell = Object.entries(shellCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
        const inShell = satellites.filter((s) => s.shell === targetShell).sort((a, b) => a.position.lon - b.position.lon)
        const afflicted = inShell.slice(0, Math.max(20, Math.floor(inShell.length * 0.9)))
        const downSet = new Set(afflicted.map((s) => s.id))

        afflicted.forEach((sat) => {
          sat.state = 'Down'
          sat.islLinks = []
          sat.groundStation = null
          sat.runningWorkloads = []
        })

        // Drop ISLs pointing to down nodes across the shell for a visible split
        satellites.forEach((sat) => {
          sat.islLinks = sat.islLinks.filter((peer) => !downSet.has(peer))
        })

        controlPlane = {
          ...controlPlane,
          globalLiveness: 'Partitioned',
          replicas: controlPlane.replicas.filter((id) => !downSet.has(id)),
        }
      }

      if (scope === 'gs') {
        satellites.slice(0, 6).forEach((sat) => {
          sat.groundStation = null
          if (sat.state !== 'Down') sat.state = 'Partitioned'
        })
        controlPlane = { ...controlPlane, globalLiveness: 'Degraded' }
      }

      if (scope === 'battery') {
        satellites.slice(0, 8).forEach((sat) => {
          sat.battery.current = 5
          sat.state = 'Partitioned'
        })
        controlPlane = { ...controlPlane, globalLiveness: 'Degraded' }
      }

      return { satellites, controlPlane }
    }),
  updateWorkloadPolicy: (id, updates) =>
    set((state) => ({
      workloads: state.workloads.map((wl) =>
        wl.id === id
          ? {
              ...wl,
              policy: { ...wl.policy, ...updates },
              replicas: updates.replicas ?? wl.policy.replicas,
            }
          : wl,
      ),
    })),
  adjustShellAltitude: (delta) =>
    set((state) => ({
      satellites: state.satellites.map((sat) => ({ ...sat, position: { ...sat.position, alt: sat.position.alt + delta } })),
    })),
  nudgeGroundStations: (lonDelta) => {
    simulationConfig.groundStations = simulationConfig.groundStations.map((gs) => ({
      ...gs,
      coordinates: { ...gs.coordinates, lon: gs.coordinates.lon + lonDelta },
    }))
  },
  setTle: (text) => set((state) => ({ operator: { ...state.operator, tle: text } })),
  deployImage: (image) =>
    set((state) => {
      const satellites = state.satellites.map((sat) => ({
        ...sat,
        deployedComponents: [...(sat.deployedComponents ?? [])],
      }))
      const targets = satellites
        .filter((s) => s.state === 'Healthy')
        .sort((a, b) => b.battery.current - a.battery.current)
      const chosen = targets.slice(0, 6)
      chosen.forEach((sat) => {
        sat.deployedComponents = Array.from(new Set([...(sat.deployedComponents ?? []), image]))
      })
      return {
        satellites,
        operator: {
          ...state.operator,
          deploymentImage: image,
          deploymentStatus: 'done',
          deploymentTargets: chosen.map((c) => c.id),
        },
      }
    }),
  setCustomZones: (zones) =>
    set((state) => {
      const cleaned = zones.length ? zones : simulationConfig.zones
      return {
        operator: { ...state.operator, customZones: cleaned },
        filters: { ...state.filters, zones: cleaned },
      }
    }),
  reset: () => set({ ...buildInitialState(), time: 0 }),
  outageViews: () => {
    const state = get()
    return {
      noOs: outagePerspective(state.satellites, state.workloads, state.controlPlane, false),
      withOs: outagePerspective(state.satellites, state.workloads, state.controlPlane, true),
    }
  },
}))
