import { useSimulationStore } from '../state/simulationStore'

const SpeedToggle = () => {
  const current = useSimulationStore((s) => s.speed)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const speeds = [1, 10, 100]
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-1">
      {speeds.map((s) => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${current === s ? 'bg-space-accent/20 text-space-accent shadow-glow' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
        >
          {s}x
        </button>
      ))}
    </div>
  )
}

export const TopBar = () => {
  const controlPlane = useSimulationStore((s) => s.controlPlane)
  const derivatives = useSimulationStore((s) => s.derivatives)
  const modes = useSimulationStore((s) => s.modes)

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-space-panel/90 via-space-panel/60 to-black/40 p-4 shadow-glow md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-space-accent">Orbital OS</div>
        <div className="text-2xl font-semibold text-slate-100">LEO constellation control + cloud layer</div>
        <p className="text-sm text-slate-400">Mobility-aware scheduling, resilient control plane, and energy-smart placement for 100+ satellites.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-300">
          Control Plane <span className="ml-2 rounded bg-green-500/20 px-2 py-1 text-xs text-green-200">{controlPlane.globalLiveness}</span>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-300">
          Scheduler: latency {(derivatives.latencyScore * 100).toFixed(0)}% • energy {(derivatives.energyScore * 100).toFixed(0)}% • resilience {(derivatives.resilienceScore * 100).toFixed(0)}%
        </div>
        <div className="flex gap-1 text-[10px] uppercase tracking-wide text-slate-400">
          {modes.kriosPrewarm && <span className="rounded bg-space-accent/20 px-2 text-space-accent">Krios</span>}
          {modes.starloomFederation && <span className="rounded bg-purple-400/20 px-2 text-purple-200">StarLoom</span>}
          {modes.energyBudget && <span className="rounded bg-emerald-400/20 px-2 text-emerald-200">Energy</span>}
        </div>
        <SpeedToggle />
      </div>
    </div>
  )
}
