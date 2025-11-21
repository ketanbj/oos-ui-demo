import { useMemo } from 'react'
import { outagePerspective } from '../simulation/outage'
import { useSimulationStore } from '../state/simulationStore'

const Panel = ({ title, blastRadius, failures, liveness }: { title: string; blastRadius: number; failures: string[]; liveness: string }) => (
  <div className="glass h-full rounded-2xl p-4">
    <div className="flex items-center justify-between">
      <div className="text-lg font-semibold text-slate-50">{title}</div>
      <div className={`rounded px-2 py-1 text-xs ${title.includes('With') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>{liveness}</div>
    </div>
    <div className="mt-3 space-y-2 text-sm text-slate-300">
      <div className="flex items-center justify-between">
        <span>Blast radius</span>
        <span className="font-semibold text-space-accent">{(blastRadius * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5">
        <div className="h-2 rounded-full bg-gradient-to-r from-red-400 via-orange-400 to-yellow-300" style={{ width: `${Math.min(100, blastRadius * 100)}%` }} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Workloads impacted</div>
        <div className="text-space-accent">{failures.length ? failures.join(', ') : 'Auto-migrated (0 failed)'}</div>
      </div>
      <p className="text-xs text-slate-400">
        Scenario: ISL cut across a plane + two GS drops. Left shows cascading failure without coordination; right shows Orbital OS limiting scope, keeping the control plane live, and migrating workloads in-flight.
      </p>
    </div>
  </div>
)

export const OutageSplit = () => {
  const satellites = useSimulationStore((s) => s.satellites)
  const workloads = useSimulationStore((s) => s.workloads)
  const controlPlane = useSimulationStore((s) => s.controlPlane)

  const { noOs, withOs } = useMemo(
    () => ({
      noOs: outagePerspective(satellites, workloads, controlPlane, false),
      withOs: outagePerspective(satellites, workloads, controlPlane, true),
    }),
    [satellites, workloads, controlPlane],
  )

  return (
    <section id="outage" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-space-accent">Outage simulation</div>
          <h2 className="text-xl font-semibold text-slate-100">Starlink-style plane cut comparison</h2>
          <p className="text-sm text-slate-400">Left: cascading failure. Right: Orbital OS containing blast radius, keeping liveness, auto-rebalancing workloads.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Without Orbital OS" blastRadius={noOs.blastRadius} failures={noOs.failedWorkloads} liveness={noOs.controlPlane.globalLiveness} />
        <Panel title="With Orbital OS" blastRadius={withOs.blastRadius} failures={withOs.failedWorkloads} liveness={withOs.controlPlane.globalLiveness} />
      </div>
    </section>
  )
}
