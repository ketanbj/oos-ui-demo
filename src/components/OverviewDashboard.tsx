import { useMemo } from 'react'
import { OrbitalCanvas } from './OrbitalCanvas'
import { useSimulationStore } from '../state/simulationStore'
import { simulationConfig } from '../simulation/config'
import { ModesPanel } from './ModesPanel'
import { ControlPlaneStatus } from './ControlPlaneStatus'

const StatCard = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="glass flex flex-col rounded-xl p-3">
    <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
    <span className={`text-xl font-semibold ${accent ?? 'text-slate-50'}`}>{value}</span>
  </div>
)

const LayerToggles = () => {
  const filters = useSimulationStore((s) => s.filters)
  const toggleLayer = useSimulationStore((s) => s.toggleLayer)
  const layers: Array<[keyof typeof filters.layers, string]> = [
    ['isl', 'ISL links'],
    ['energy', 'Energy heatmap'],
    ['workloads', 'Workload overlay'],
    ['heatmap', 'Availability zones'],
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {layers.map(([key, label]) => (
        <button
          key={key}
          onClick={() => toggleLayer(key)}
          className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${filters.layers[key] ? 'border-space-accent bg-space-accent/15 text-space-accent' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const FilterGroup = () => {
  const filters = useSimulationStore((s) => s.filters)
  const setShells = useSimulationStore((s) => s.setShells)
  const setZones = useSimulationStore((s) => s.setZones)

  const toggleShell = (id: string) => {
    if (filters.shells.includes(id)) setShells(filters.shells.filter((s) => s !== id))
    else setShells([...filters.shells, id])
  }
  const toggleZone = (id: string) => {
    if (filters.zones.includes(id)) setZones(filters.zones.filter((z) => z !== id))
    else setZones([...filters.zones, id])
  }

  return (
    <div className="glass rounded-xl p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">Filters</div>
      <div className="mt-2 text-xs text-slate-300">
        Shells:
        <div className="mt-1 flex flex-wrap gap-2">
          {simulationConfig.shells.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleShell(s.id)}
              className={`rounded-lg px-2 py-1 ${filters.shells.includes(s.id) ? 'bg-space-accent/20 text-space-accent' : 'bg-white/5 text-slate-300'}`}
            >
              {s.id} ({s.satellites})
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-300">
        Availability zones:
        <div className="mt-1 flex gap-2">
          {['americas', 'emea', 'apac'].map((zone) => (
            <button
              key={zone}
              onClick={() => toggleZone(zone)}
              className={`rounded-lg px-2 py-1 ${filters.zones.includes(zone) ? 'bg-space-accent/20 text-space-accent' : 'bg-white/5 text-slate-300'}`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <LayerToggles />
      </div>
    </div>
  )
}

export const OverviewDashboard = () => {
  const satellites = useSimulationStore((s) => s.satellites)

  const stats = useMemo(() => {
    const healthy = satellites.filter((s) => s.state === 'Healthy').length
    const degraded = satellites.filter((s) => s.state !== 'Healthy').length
    const sunlight = satellites.filter((s) => s.inSunlight).length
    const avgBattery = satellites.reduce((acc, sat) => acc + sat.battery.current, 0) / satellites.length
    return { healthy, degraded, sunlight, avgBattery }
  }, [satellites])

  return (
    <section id="overview" className="space-y-4">
      <ModesPanel />
      <ControlPlaneStatus />
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Satellites" value={`${satellites.length}`} accent="text-space-accent" />
            <StatCard label="Healthy" value={`${stats.healthy}`} accent="text-green-300" />
            <StatCard label="Sunlit" value={`${stats.sunlight}`} accent="text-yellow-200" />
            <StatCard label="Avg battery" value={`${stats.avgBattery.toFixed(1)}%`} />
          </div>
          <div className="mt-4 text-sm text-slate-400">
            Automatic handovers tie to the closest ground station; ISLs stay alive during plane crossings; hover a satellite to inspect battery, ISLs, workloads, and zone.
          </div>
          <div className="mt-4">
            <FilterGroup />
          </div>
        </div>
        <div className="w-full lg:w-2/3">
          <OrbitalCanvas />
        </div>
      </div>
    </section>
  )
}
