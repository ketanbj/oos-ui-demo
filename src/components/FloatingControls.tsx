import { useSimulationStore } from '../state/simulationStore'

const speeds = [1, 10, 100]

export const FloatingControls = () => {
  const speed = useSimulationStore((s) => s.speed)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const paused = useSimulationStore((s) => s.paused)
  const togglePause = useSimulationStore((s) => s.togglePause)
  const stepOnce = useSimulationStore((s) => s.stepOnce)

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30 w-72 rounded-2xl border border-white/10 bg-space-panel/90 p-3 shadow-glow backdrop-blur">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="uppercase tracking-[0.2em] text-space-accent">Sim control</span>
        <span>{paused ? 'Paused' : 'Running'}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={togglePause}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            paused ? 'bg-space-accent/20 text-space-accent' : 'bg-white/10 text-slate-100 hover:bg-white/20'
          }`}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="rounded-xl bg-white/10 px-3 py-2 text-sm text-slate-100 hover:bg-white/20" onClick={() => stepOnce(1)}>
          +1s
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
        <span>Speed</span>
        <div className="flex gap-1">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                speed === s ? 'bg-space-accent/25 text-space-accent shadow-glow' : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Always-on telemetry: pause for deterministic steps, jog +1s to align demo beats.</p>
    </div>
  )
}
