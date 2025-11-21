import { useSimulationStore } from '../state/simulationStore'

export const ControlPlaneStatus = () => {
  const controlPlane = useSimulationStore((s) => s.controlPlane)
  const modes = useSimulationStore((s) => s.modes)
  const satellites = useSimulationStore((s) => s.satellites)

  if (!modes.starloomFederation) return null

  const cohorts = ['north', 'equatorial', 'south']
  const cohortMap: Record<string, number> = { north: 0, equatorial: 0, south: 0 }
  satellites.forEach((sat) => {
    const band = sat.position.lat > 20 ? 'north' : sat.position.lat < -20 ? 'south' : 'equatorial'
    cohortMap[band] += sat.state === 'Down' ? 0 : 1
  })

  return (
    <div className="glass rounded-2xl p-3 text-sm text-slate-200">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Control-plane cohorts (StarLoom)</div>
        <div className="text-xs text-slate-400">Disaggregated liveness + config</div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {cohorts.map((c) => (
          <div key={c} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-wide text-purple-200">{c}</span>
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-100">Live</span>
            </div>
            <div className="mt-1 text-slate-300">Replicas: {controlPlane.replicas.length}</div>
            <div className="text-slate-400">Healthy nodes: {cohortMap[c]}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Cohorts stage config pushes and fence blast radius; outages only partition one cohort while global liveness stays Live.</p>
    </div>
  )
}
