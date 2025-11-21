import type { Satellite, ZoneHandover } from './types'
import { simulationConfig } from './config'

interface HandoverParams {
  leadTime: number // seconds to prewarm before handover
  zones?: string[]
}

const zoneAnchors: Record<string, number> = {
  americas: simulationConfig.groundStations.find((g) => g.id === 'gs-sea')?.coordinates.lon ?? -122,
  emea: simulationConfig.groundStations.find((g) => g.id === 'gs-lhr')?.coordinates.lon ?? 0,
  apac: simulationConfig.groundStations.find((g) => g.id === 'gs-syd')?.coordinates.lon ?? 151,
}

export const computeZoneHandovers = (sats: Satellite[], params: HandoverParams): ZoneHandover[] => {
  const zones = params.zones?.length ? params.zones : simulationConfig.zones
  return zones.map((zone) => {
    const anchorLon = zoneAnchors[zone] ?? 0
    const candidates = sats.filter((s) => s.zone === zone && s.state !== 'Down').sort((a, b) => Math.abs(a.position.lon - anchorLon) - Math.abs(b.position.lon - anchorLon))
    const active = candidates[0]
    const warm = candidates[1]
    const nextHandoverSec = active ? Math.max(10, 120 - Math.abs(active.position.lon - anchorLon)) : 0
    const confidence = active ? Math.min(1, 0.5 + Math.abs(active.position.lon - anchorLon) / 180) : 0
    const target = warm?.id ?? null
    return {
      zone,
      active: active?.id ?? null,
      warm: warm?.id ?? null,
      nextHandoverSec,
      target,
      confidence,
    }
  })
}

export const enforceActiveWarm = (sats: Satellite[], zone: string) => {
  const zoneSats = sats.filter((s) => s.zone === zone && s.state !== 'Down')
  zoneSats.sort((a, b) => b.battery.current - a.battery.current)
  const active = zoneSats[0]
  const warm = zoneSats[1]
  return { active, warm }
}
