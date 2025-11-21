import { useSimulationStore } from '../state/simulationStore'

export const HandoverTimeline = () => {
  const handovers = useSimulationStore((s) => s.handovers)
  const modes = useSimulationStore((s) => s.modes)
  const zones = useSimulationStore((s) => s.filters.zones)
  if (!modes.kriosPrewarm) return null

  return (
    <div className="glass rounded-2xl p-3 text-sm text-slate-200">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Predictive handovers (Krios zones)</div>
        <div className="text-xs text-slate-400">Active + warm per zone</div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3 text-xs text-slate-300">
        {zones.map((zone) => {
          const h = handovers.find((z) => z.zone === zone) ?? {
            zone,
            active: null,
            warm: null,
            target: null,
            nextHandoverSec: 0,
            confidence: 0,
          }
          return (
            <div key={h.zone} className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wide text-space-accent">{h.zone}</span>
                <span className="text-[11px] text-slate-400">next {Math.round(h.nextHandoverSec)}s</span>
              </div>
              <div className="mt-1">Active: {h.active ?? 'none'}</div>
              <div>Warm: {h.warm ?? 'preparing...'}</div>
              <div className="text-[11px] text-slate-400">Target: {h.target ?? 'TBD'} • confidence {(h.confidence * 100).toFixed(0)}%</div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Each zone maintains 1 active + 1 warm to match terrestrial availability with minimal replicas; handover prep starts before GS exit.</p>
    </div>
  )
}
