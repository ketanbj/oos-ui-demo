import type { Satellite } from './types'
import { degToRad } from './utils'

export const isInSunlight = (time: number, sat: Satellite) => {
  const orbitalDay = Math.sin(time / 900 + degToRad(sat.position.lon))
  const seasonalShift = Math.cos(degToRad(sat.position.lat)) * 0.2
  return orbitalDay + seasonalShift > -0.05
}

export const batteryDelta = (sat: Satellite, inSunlight: boolean, energyBudget = false) => {
  const workloadLoad = sat.runningWorkloads.length * 0.004
  const baseDrain = 0.005 + workloadLoad
  const budgetPenalty = energyBudget ? 0.003 : 0
  if (inSunlight) {
    return 0.008 - workloadLoad * 0.6 - budgetPenalty
  }
  return -baseDrain - budgetPenalty
}

export const clampBattery = (value: number) => Math.max(5, Math.min(100, value))
