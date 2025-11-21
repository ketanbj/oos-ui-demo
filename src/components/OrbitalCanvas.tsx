import { Canvas, useFrame } from '@react-three/fiber'
import { Line, OrbitControls, Stars } from '@react-three/drei'
import { useMemo, useState } from 'react'
import * as THREE from 'three'
import { useSimulationStore } from '../state/simulationStore'
import { positionToVector3 } from '../simulation/utils'
import type { Satellite } from '../simulation/types'
import { simulationConfig } from '../simulation/config'

const SatellitePoint = ({
  sat,
  showEnergy,
  highlightWorkloads,
  onHover,
}: {
  sat: Satellite
  showEnergy: boolean
  highlightWorkloads: boolean
  onHover: (sat: Satellite | null) => void
}) => {
  const [hovered, setHovered] = useState(false)
  const pos = useMemo(() => {
    const { x, y, z } = positionToVector3(sat.position.lat, sat.position.lon, sat.position.alt)
    return new THREE.Vector3(x, y, z)
  }, [sat.position.alt, sat.position.lat, sat.position.lon])

  const stateColor = sat.state === 'Down' ? '#ff7b7b' : sat.state === 'Partitioned' ? '#f59e0b' : sat.state === 'Degraded' ? '#7dd3fc' : '#6de3ff'
  const energyBlend = sat.battery.current > 70 ? '#7ce7b7' : sat.battery.current > 40 ? '#7dd3fc' : '#f59e0b'
  const color = showEnergy ? energyBlend : stateColor
  const workloadLift = highlightWorkloads && sat.runningWorkloads.length ? 0.006 * sat.runningWorkloads.length : 0

  return (
    <mesh
      position={pos}
      onPointerOver={() => {
        setHovered(true)
        onHover(sat)
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover(null)
      }}
    >
      <sphereGeometry args={[workloadLift + (hovered ? 0.024 : 0.018), 12, 12]} />
      <meshStandardMaterial emissive={new THREE.Color(color)} color={color} emissiveIntensity={hovered ? 3 : 1.6} />
    </mesh>
  )
}

const GroundStationPoint = ({ lat, lon }: { lat: number; lon: number }) => {
  const pos = useMemo(() => {
    const { x, y, z } = positionToVector3(lat, lon, 0)
    return new THREE.Vector3(x * 0.98, y * 0.98, z * 0.98)
  }, [lat, lon])
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.015, 10, 10]} />
      <meshStandardMaterial emissive={'#7c5cf4'} color={'#9b8afa'} emissiveIntensity={2.4} />
    </mesh>
  )
}

const InterSatLinks = ({ sat, lookup }: { sat: Satellite; lookup: Map<string, Satellite> }) => {
  const points = sat.islLinks
    .filter((target) => sat.id < target)
    .map((target) => lookup.get(target))
    .filter(Boolean)
    .map((peer) => {
      const start = positionToVector3(sat.position.lat, sat.position.lon, sat.position.alt)
      const end = positionToVector3(peer!.position.lat, peer!.position.lon, peer!.position.alt)
      return [new THREE.Vector3(start.x, start.y, start.z), new THREE.Vector3(end.x, end.y, end.z)]
    })

  return (
    <>
      {points.map((pair, idx) => (
        <Line key={`${sat.id}-${idx}`} points={pair} color="#1dc9ff" lineWidth={1} dashed dashSize={0.1} gapSize={0.05} />
      ))}
    </>
  )
}

const Scene = ({ onHover }: { onHover: (sat: Satellite | null) => void }) => {
  const satellites = useSimulationStore((s) => s.satellites)
  const filters = useSimulationStore((s) => s.filters)
  const step = useSimulationStore((s) => s.step)
  const stations = simulationConfig.groundStations
  const [time, setTime] = useState(0)

  useFrame((_, delta) => {
    step(delta)
    setTime((t) => t + delta)
  })

  const visible = satellites.filter((s) => filters.shells.includes(s.shell) && filters.zones.includes(s.zone))
  const satLookup = useMemo(() => new Map(visible.map((s) => [s.id, s])), [visible])

  return (
    <>
      <color attach="background" args={[0, 0, 0]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#7ce7b7" />
      <Stars radius={80} depth={60} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={filters.layers.heatmap ? '#0f172a' : '#0b1224'}
          emissive={filters.layers.heatmap ? '#12304f' : '#0b1224'}
          emissiveIntensity={filters.layers.heatmap ? 0.8 : 0.4}
        />
      </mesh>

      {stations.map((gs) => (
        <GroundStationPoint key={gs.id} lat={gs.coordinates.lat} lon={gs.coordinates.lon} />
      ))}

      {filters.layers.isl &&
        visible.map((sat) => <InterSatLinks lookup={satLookup} sat={sat} key={`isl-${sat.id}`} />)}

      {visible.map((sat) => (
        <SatellitePoint
          key={sat.id}
          sat={sat}
          showEnergy={filters.layers.energy}
          highlightWorkloads={filters.layers.workloads}
          onHover={onHover}
        />
      ))}

      <OrbitControls enablePan={false} minDistance={2} maxDistance={6} autoRotate autoRotateSpeed={0.25 + time * 0.0001} />
    </>
  )
}

export const OrbitalCanvas = () => {
  const [hovered, setHovered] = useState<Satellite | null>(null)

  return (
    <div className="relative h-[540px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
        <Scene onHover={setHovered} />
      </Canvas>
      {hovered && (
        <div className="glass pointer-events-none absolute left-4 top-4 max-w-sm rounded-xl p-4 text-xs text-slate-100">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-space-accent">{hovered.id}</div>
            <div className="rounded bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">{hovered.state}</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>Battery: {hovered.battery.current.toFixed(1)}%</div>
            <div>Sunlight: {hovered.inSunlight ? 'Yes' : 'Eclipse'}</div>
            <div>Zone: {hovered.zone}</div>
            <div>GS: {hovered.groundStation ?? 'handover...'}</div>
            <div>ISL: {hovered.islLinks.length}</div>
            <div>Workloads: {hovered.runningWorkloads.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}
