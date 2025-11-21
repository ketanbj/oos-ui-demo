import { useSimulationStore } from '../state/simulationStore'

export const ModesPanel = () => {
  const modes = useSimulationStore((s) => s.modes)
  const toggleMode = useSimulationStore((s) => s.toggleMode)

  const items: Array<{ key: keyof typeof modes; label: string; desc: string }> = [
    { key: 'kriosPrewarm', label: 'Krios zones + prewarm', desc: 'Keep one active + one warm per zone; predictive handovers' },
    { key: 'starloomFederation', label: 'StarLoom federation', desc: 'Disaggregated control cohorts; staged rollouts' },
    { key: 'energyBudget', label: 'Energy budget', desc: 'Cap draw; shed batch/AI FPS; eclipse-aware moves' },
  ]

  return (
    <div className="glass flex flex-wrap gap-2 rounded-2xl p-3 text-sm text-slate-200">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => toggleMode(item.key)}
          className={`relative flex-1 min-w-[200px] rounded-xl border px-3 py-2 text-left transition ${
            modes[item.key]
              ? 'border-space-accent bg-space-accent/15 text-space-accent shadow-glow'
              : 'border-white/10 bg-white/5 text-slate-200'
          }`}
        >
          <div className="font-semibold">{item.label}</div>
          <p className="text-xs text-slate-400">{item.desc}</p>
          {modes[item.key] && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-space-accent" />}
        </button>
      ))}
    </div>
  )
}
