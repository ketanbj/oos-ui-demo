import { useSimulationStore } from '../state/simulationStore'
import { greatCircleDistance } from '../simulation/utils'
import { kriosLatencyTargets } from '../data/latencyTargets'

export const PathExplainer = () => {
  const workloads = useSimulationStore((s) => s.workloads)
  const satellites = useSimulationStore((s) => s.satellites)
  const modes = useSimulationStore((s) => s.modes)
  if (!modes.kriosPrewarm) return null

  const first = workloads[0]
  if (!first) return null
  const sat = satellites.find((s) => first.assignments[0] === s.id)
  const target = kriosLatencyTargets[0]
  if (!sat || !target) return null
  const dist = greatCircleDistance(sat.position.lat, sat.position.lon, target.lat, target.lon)
  const estRtt = Math.round((dist + sat.position.alt) / 200 + 8)

  return (
    <div className="glass rounded-2xl p-3 text-xs text-slate-200">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-slate-100">Path explainer</div>
        <div className="text-slate-400">GS backhaul vs ISL</div>
      </div>
      <p className="mt-1 text-slate-300">{first.type} placed on {sat.id}:</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-300">
        <li>Estimated RTT to {target.name}: {estRtt} ms (great-circle {dist.toFixed(0)} km)</li>
        <li>Energy: {sat.inSunlight ? 'sunlit' : 'eclipse'}, battery {sat.battery.current.toFixed(0)}%</li>
        <li>Mode: {modes.energyBudget ? 'energy budget (shed heavy jobs)' : 'normal'}</li>
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">Flip routing mode in policy to compare ISL-first vs GS-backhaul paths; placements shift toward anchors with better RTT under Krios mode.</p>
    </div>
  )
}
