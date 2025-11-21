import { useMemo } from 'react'
import { useSimulationStore } from '../state/simulationStore'

const Sparkline = ({ time, amplitude }: { time: number; amplitude: number }) => {
  const points = Array.from({ length: 24 }).map((_, idx) => {
    const t = time * 0.4 + idx / 2
    return 50 + Math.sin(t * 0.12) * amplitude + Math.cos(t * 0.05) * (amplitude / 2)
  })
  const path = points.map((p, idx) => `${(idx / (points.length - 1)) * 100},${100 - p}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-full">
      <polyline fill="none" stroke="url(#grad)" strokeWidth="3" points={path} />
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6de3ff" />
          <stop offset="100%" stopColor="#7c5cf4" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export const EnergyPanel = () => {
  const satellites = useSimulationStore((s) => s.satellites)
  const time = useSimulationStore((s) => s.time)
  const workloads = useSimulationStore((s) => s.workloads)

  const metrics = useMemo(() => {
    const sunlit = satellites.filter((s) => s.inSunlight)
    const eclipsed = satellites.length - sunlit.length
    const avgBattery = satellites.reduce((acc, sat) => acc + sat.battery.current, 0) / satellites.length
    const aiWorkloads = workloads.find((w) => w.type.includes('AI'))
    return { sunlit: sunlit.length, eclipsed, avgBattery, aiWorkloads }
  }, [satellites, workloads])

  return (
    <section id="energy" className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-space-accent">Energy awareness</div>
        <h2 className="text-xl font-semibold text-slate-100">Eclipse response & battery-aware scheduling</h2>
        <p className="text-sm text-slate-400">Satellites in eclipse drain; the scheduler migrates AI to sunlit craft, pauses batch, and keeps essential services pinned to high-battery replicas.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-2xl p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
            <div className="rounded-lg bg-white/5 px-3 py-2">
              Sunlit: <span className="text-space-accent">{metrics.sunlit}</span> • Eclipse: <span className="text-red-200">{metrics.eclipsed}</span>
            </div>
            <div className="rounded-lg bg-white/5 px-3 py-2">Avg battery: {metrics.avgBattery.toFixed(1)}%</div>
            <div className="rounded-lg bg-white/5 px-3 py-2">AI replicas: {metrics.aiWorkloads?.assignments.length ?? 0}</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-300">
            <div className="rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="font-semibold text-slate-100">Battery vs time</div>
              <Sparkline time={time} amplitude={18} />
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="font-semibold text-slate-100">Workload moves</div>
              <Sparkline time={time + 5} amplitude={12} />
            </div>
            <div className="rounded-lg border border-white/5 bg-white/5 p-3">
              <div className="font-semibold text-slate-100">Job completions</div>
              <Sparkline time={time + 10} amplitude={9} />
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Eclipse windows are simulated as the orbital day-night boundary crosses each shell. Migration happens proactively as a satellite enters shadow; low-priority batch is paused automatically.
          </div>
        </div>
        <div className="space-y-3">
          <div className="glass rounded-xl p-3 text-sm text-slate-200">
            <div className="font-semibold text-slate-100">Scheduler actions</div>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-300">
              <li>Migrate AI workloads toward sunlit craft with GS margin</li>
              <li>Pause batch jobs during deep eclipse; resume on charge</li>
              <li>Prefer replicas with &gt;50% battery and stable ISLs</li>
              <li>Hold essential services on diverse shells/zones</li>
            </ul>
          </div>
          <div className="glass rounded-xl p-3 text-xs text-slate-300">
            <div className="font-semibold text-slate-100">Mobility timeline</div>
            <p className="mt-1">Upcoming handovers predicted from velocity + shell inclination. The control plane pre-warms replicas in the target zone to avoid latency spikes.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
