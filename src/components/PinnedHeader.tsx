import { useMemo } from 'react'
import { TopBar } from './TopBar'
import { useSimulationStore } from '../state/simulationStore'
import { simulationConfig } from '../simulation/config'
import { LayerToggles } from './LayerToggles'

const StatCard = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`text-xl font-semibold ${accent ?? 'text-slate-50'}`}>{value}</div>
  </div>
)

export const PinnedHeader = () => {
  const satellites = useSimulationStore((s) => s.satellites)
  const filters = useSimulationStore((s) => s.filters)
  const setShells = useSimulationStore((s) => s.setShells)
  const setZones = useSimulationStore((s) => s.setZones)

  const stats = useMemo(() => {
    const healthy = satellites.filter((s) => s.state === 'Healthy').length
    const sunlight = satellites.filter((s) => s.inSunlight).length
    const avgBattery = satellites.reduce((acc, sat) => acc + sat.battery.current, 0) / satellites.length
    return { healthy, sunlight, avgBattery }
  }, [satellites])

  const toggleShell = (id: string) => {
    if (filters.shells.includes(id)) setShells(filters.shells.filter((s) => s !== id))
    else setShells([...filters.shells, id])
  }

  const toggleZone = (id: string) => {
    if (filters.zones.includes(id)) setZones(filters.zones.filter((z) => z !== id))
    else setZones([...filters.zones, id])
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-space-bg/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1600px] px-6 py-3 space-y-3">
        <TopBar />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatCard label="Satellites" value={`${satellites.length}`} accent="text-space-accent" />
            <StatCard label="Healthy" value={`${stats.healthy}`} accent="text-green-300" />
            <StatCard label="Sunlit" value={`${stats.sunlight}`} accent="text-yellow-200" />
            <StatCard label="Avg battery" value={`${stats.avgBattery.toFixed(1)}%`} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="uppercase tracking-wide text-slate-400">Shells</span>
            {simulationConfig.shells.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleShell(s.id)}
                className={`rounded-lg px-2 py-[6px] ${filters.shells.includes(s.id) ? 'bg-space-accent/20 text-space-accent' : 'bg-white/5 text-slate-300'}`}
              >
                {s.id}
              </button>
            ))}
            <span className="ml-4 uppercase tracking-wide text-slate-400">Zones</span>
            {['americas', 'emea', 'apac'].map((zone) => (
              <button
                key={zone}
                onClick={() => toggleZone(zone)}
                className={`rounded-lg px-2 py-[6px] ${filters.zones.includes(zone) ? 'bg-space-accent/20 text-space-accent' : 'bg-white/5 text-slate-300'}`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-wide text-slate-400">Layers</div>
          <LayerToggles />
        </div>
      </div>
    </div>
  )
}
