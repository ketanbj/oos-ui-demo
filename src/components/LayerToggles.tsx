import { useSimulationStore } from '../state/simulationStore'

export const LayerToggles = () => {
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
