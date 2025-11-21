import { useMemo, useState } from 'react'
import { useSimulationStore } from '../state/simulationStore'

const hashForSat = (id: string, battery: number) => {
  const base = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return `cfg-${Math.abs(Math.sin(base + battery)).toString(16).slice(2, 8)}`
}

const gsList = [
  { id: 'gs-sea', name: 'Seattle' },
  { id: 'gs-gdl', name: 'Guadalajara' },
  { id: 'gs-lhr', name: 'London' },
  { id: 'gs-dxb', name: 'Dubai' },
  { id: 'gs-syd', name: 'Sydney' },
]

const GsSatTable = () => {
  const satellites = useSimulationStore((s) => s.satellites)

  const counts = gsList.map((gs) => ({
    ...gs,
    sats: satellites.filter((s) => s.groundStation === gs.id).length,
  }))

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
      <div className="font-semibold text-slate-100">Ground stations ↔ satellites</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {counts.map((gs) => (
          <div key={gs.id} className="rounded bg-black/30 px-2 py-1">
            <div className="text-space-accent">{gs.name}</div>
            <div className="text-slate-300">{gs.sats} satellites mapped</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Updating GS map re-runs zone assignment and handover planning.</p>
    </div>
  )
}

export const OperatorPanel = () => {
  const paused = useSimulationStore((s) => s.paused)
  const togglePause = useSimulationStore((s) => s.togglePause)
  const stepOnce = useSimulationStore((s) => s.stepOnce)
  const injectFailure = useSimulationStore((s) => s.injectFailure)
  const adjustShellAltitude = useSimulationStore((s) => s.adjustShellAltitude)
  const nudgeGroundStations = useSimulationStore((s) => s.nudgeGroundStations)
  const satellites = useSimulationStore((s) => s.satellites)
  const operator = useSimulationStore((s) => s.operator)
  const setTle = useSimulationStore((s) => s.setTle)
  const deployImage = useSimulationStore((s) => s.deployImage)
  const setCustomZones = useSimulationStore((s) => s.setCustomZones)

  const [altDelta, setAltDelta] = useState(10)
  const [tleText, setTleText] = useState(operator.tle)
  const [image, setImage] = useState(operator.deploymentImage || 'orbitalos/control-plane:latest')
  const [zonesText, setZonesText] = useState(operator.customZones.join(','))

  const hashes = useMemo(
    () => satellites.slice(0, 6).map((sat) => ({ id: sat.id, hash: hashForSat(sat.id, sat.battery.current) })),
    [satellites],
  )

  const deployedList = operator.deploymentTargets.length ? operator.deploymentTargets.join(', ') : 'none yet'

  return (
    <section id="operator" className="space-y-3">
      <div className="text-xs uppercase tracking-[0.3em] text-space-accent">Operator mode</div>
      <div className="glass grid gap-3 rounded-2xl p-4 lg:grid-cols-3">
        <div className="space-y-2 text-sm text-slate-200">
          <div className="font-semibold text-slate-100">1) Provide ephemeris (TLE)</div>
          <textarea
            className="w-full rounded-lg bg-black/40 p-2 text-xs text-slate-200"
            rows={4}
            placeholder="Paste TLE here..."
            value={tleText}
            onChange={(e) => setTleText(e.target.value)}
          />
          <button className="rounded-lg bg-space-accent/20 px-3 py-1 text-space-accent" onClick={() => setTle(tleText)}>
            Save TLE / ephemeris
          </button>
          <p className="text-xs text-slate-400">Orbital OS ingests TLEs to project passes and prewarm handovers.</p>
          <div className="font-semibold text-slate-100">2) Define LEO zones</div>
          <input
            className="w-full rounded-lg bg-black/40 p-2 text-xs text-slate-200"
            placeholder="americas,emea,apac"
            value={zonesText}
            onChange={(e) => setZonesText(e.target.value)}
          />
          <button className="rounded-lg bg-white/10 px-3 py-1 text-slate-100" onClick={() => setCustomZones(zonesText.split(',').map((z) => z.trim()).filter(Boolean))}>
            Set zones
          </button>
          <p className="text-xs text-slate-400">Zones drive latency anchors and GS selection; matches Krios-style availability targets.</p>
        </div>

        <div className="space-y-2 text-sm text-slate-200">
          <div className="font-semibold text-slate-100">3) Deploy components to satellites</div>
          <input
            className="w-full rounded-lg bg-black/40 p-2 text-xs text-slate-200"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <button className="mt-1 rounded-lg bg-space-accent/20 px-3 py-1 text-space-accent" onClick={() => deployImage(image)}>
            Deploy image to healthiest sats
          </button>
          <div className="text-xs text-slate-400">Targets: {deployedList}</div>
          <div className="font-semibold text-slate-100">4) Fault drills</div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => injectFailure('plane')}>
              Plane outage
            </button>
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => injectFailure('battery')}>
              Drain batteries
            </button>
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => injectFailure('gs')}>
              Drop GS links
            </button>
          </div>
          <p className="text-xs text-slate-400">Use with StarLoom federation to see fenced blast radius and liveness retention.</p>
          <GsSatTable />
        </div>

        <div className="space-y-2 text-sm text-slate-200">
          <div className="font-semibold text-slate-100">Simulation & environment</div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-space-accent/20 px-3 py-1 text-space-accent" onClick={togglePause}>
              {paused ? 'Resume simulation' : 'Pause simulation'}
            </button>
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => stepOnce(1)}>
              Step +1s
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={-40}
              max={40}
              value={altDelta}
              onChange={(e) => setAltDelta(Number(e.target.value))}
              className="flex-1"
            />
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => adjustShellAltitude(altDelta)}>
              Adjust shells ±{altDelta}km
            </button>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => nudgeGroundStations(-2)}>
              Move GS west
            </button>
            <button className="rounded-lg bg-white/10 px-3 py-1" onClick={() => nudgeGroundStations(2)}>
              Move GS east
            </button>
          </div>
          <div className="font-semibold text-slate-100">Satellite config hashes</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {hashes.map((h) => (
              <div key={h.id} className="rounded bg-white/5 px-2 py-1">
                <div className="text-space-accent">{h.id}</div>
                <div className="text-slate-400">{h.hash}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Hashes cover config + energy state for drift detection; TLE + zone inputs feed handover planning.</p>
        </div>
      </div>
    </section>
  )
}
