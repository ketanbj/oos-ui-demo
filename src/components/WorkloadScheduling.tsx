import { useMemo, useState } from 'react'
import { useSimulationStore } from '../state/simulationStore'
import type { Workload } from '../simulation/types'
import { kriosLatencyTargets } from '../data/latencyTargets'
import { HandoverTimeline } from './HandoverTimeline'
import { PathExplainer } from './PathExplainer'

const Bar = ({ value, label, color }: { value: number; label: string; color: string }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs text-slate-300">
      <span>{label}</span>
      <span>{(value * 100).toFixed(0)}%</span>
    </div>
    <div className="h-2 w-full rounded-full bg-white/10">
      <div className="h-2 rounded-full" style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  </div>
)

const WorkloadCard = ({ wl }: { wl: Workload }) => {
  const satellites = useSimulationStore((s) => s.satellites)
  const enriched = wl.assignments
    .map((id) => satellites.find((s) => s.id === id))
    .filter(Boolean)
    .map((sat) => `${sat!.id} (${sat!.zone})`)
  return (
    <div className="glass rounded-xl p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-100">{wl.type}</div>
        <div className="text-xs text-slate-400">{wl.assignments.length}/{wl.policy.replicas} replicas</div>
      </div>
      <div className="mt-2 text-xs text-slate-300">
        Policy: ≥{wl.policy.minBattery}% battery • latency{' '}
        {wl.policy.latencyTargets.map((t) => `${t.name} ≤ ${t.maxMs}ms`).join(' / ')} • energy {wl.policy.energyPreference}
      </div>
      <div className="mt-2 text-xs text-space-accent">Assignments: {enriched.join(', ') || 'pending...'}</div>
    </div>
  )
}

const PolicyEditor = () => {
  const workloads = useSimulationStore((s) => s.workloads)
  const updatePolicy = useSimulationStore((s) => s.updateWorkloadPolicy)
  const [selected, setSelected] = useState(workloads[0]?.id ?? '')
  const target = workloads.find((w) => w.id === selected)

  const onChange = (field: keyof Workload['policy'], value: any) => {
    if (!selected) return
    updatePolicy(selected, { [field]: value })
  }

  if (!target) return null

  return (
    <div className="glass rounded-xl p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-slate-100">Policy editor</div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded bg-black/40 px-2 py-1 text-xs text-slate-200"
        >
          {workloads.map((w) => (
            <option key={w.id} value={w.id}>
              {w.type}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
        <label className="space-y-1">
          <div>Min battery</div>
          <input
            type="number"
            className="w-full rounded bg-white/5 px-2 py-1"
            value={target.policy.minBattery}
            onChange={(e) => onChange('minBattery', Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <div>Replicas</div>
          <input
            type="number"
            className="w-full rounded bg-white/5 px-2 py-1"
            value={target.policy.replicas}
            onChange={(e) => onChange('replicas', Number(e.target.value))}
          />
        </label>
        <div className="space-y-1">
          <div>Latency anchors (Krios)</div>
          <div className="grid grid-cols-2 gap-1">
            {kriosLatencyTargets.map((anchor) => {
              const checked = !!target.policy.latencyTargets.find((t) => t.name === anchor.name)
              return (
                <label key={anchor.name} className="flex items-center gap-2 text-[11px]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...target.policy.latencyTargets, anchor]
                        : target.policy.latencyTargets.filter((t) => t.name !== anchor.name)
                      onChange('latencyTargets', next.length ? next : [anchor])
                    }}
                  />
                  <span>
                    {anchor.name} ≤ {anchor.maxMs}ms
                  </span>
                </label>
              )
            })}
          </div>
        </div>
        <label className="space-y-1">
          <div>Energy preference</div>
          <select
            className="w-full rounded bg-white/5 px-2 py-1"
            value={target.policy.energyPreference}
            onChange={(e) => onChange('energyPreference', e.target.value as any)}
          >
            <option value="HighBattery">High battery</option>
            <option value="Sunlight">Sunlight</option>
            <option value="Ignore">Ignore</option>
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-slate-400">Policies feed the mobility-aware scheduler; edits take effect on the next tick.</p>
    </div>
  )
}

export const WorkloadScheduling = () => {
  const workloads = useSimulationStore((s) => s.workloads)
  const derivatives = useSimulationStore((s) => s.derivatives)
  const satellites = useSimulationStore((s) => s.satellites)

  const placement = useMemo(() => {
    const placements = workloads.flatMap((w) => w.assignments)
    const unique = new Set(placements)
    const list = Array.from(unique)
      .map((id) => satellites.find((s) => s.id === id))
      .filter(Boolean) as typeof satellites
    return list.slice(0, 6)
  }, [workloads, satellites])

  return (
    <section id="cloud" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-space-accent">Cloud layer</div>
          <h2 className="text-xl font-semibold text-slate-100">Workloads & mobility-aware scheduling</h2>
          <p className="text-sm text-slate-400">Energy-aware placement, latency pinning, and fast re-replication during handovers.</p>
        </div>
      </div>
      <HandoverTimeline />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {workloads.map((wl) => (
            <WorkloadCard key={wl.id} wl={wl} />
          ))}
          <PathExplainer />
        </div>
        <div className="space-y-3">
          <div className="glass rounded-xl p-3">
            <div className="font-semibold text-slate-100">Scheduling decision explainer</div>
            <div className="mt-2 space-y-2">
              <Bar label="Latency" value={derivatives.latencyScore} color="linear-gradient(90deg,#6de3ff,#7c5cf4)" />
              <Bar label="Energy" value={derivatives.energyScore} color="linear-gradient(90deg,#7ce7b7,#6de3ff)" />
              <Bar label="Resilience" value={derivatives.resilienceScore} color="linear-gradient(90deg,#ffb347,#ff7b7b)" />
              <Bar label="Mobility" value={derivatives.mobilityScore} color="linear-gradient(90deg,#7c5cf4,#6de3ff)" />
            </div>
            <p className="mt-3 text-xs text-slate-400">The scheduler balances latency, energy, resilience, and orbital mobility predictions. Placements prefer sunlit craft with stable GS handovers.</p>
          </div>
          <div className="glass rounded-xl p-3">
            <div className="font-semibold text-slate-100">Placement highlight</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
              {placement.map((sat) => (
                <div key={sat.id} className="rounded border border-white/5 bg-white/5 p-2">
                  <div className="font-semibold text-space-accent">{sat.id}</div>
                  <div>Zone: {sat.zone}</div>
                  <div>Battery: {sat.battery.current.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          </div>
          <PolicyEditor />
        </div>
      </div>
    </section>
  )
}
