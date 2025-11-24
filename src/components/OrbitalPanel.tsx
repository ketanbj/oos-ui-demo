import { FloatingControls } from './FloatingControls'
import { OrbitalCanvas } from './OrbitalCanvas'

export const OrbitalPanel = () => {
  return (
    <aside className="hidden lg:flex lg:w-[540px] xl:w-[580px] lg:flex-col lg:space-y-4 lg:fixed lg:right-8 lg:top-[280px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 shadow-glow">
        <div className="text-xs uppercase tracking-[0.2em] text-space-accent">Live orbital view</div>
        <div className="mt-3">
          <OrbitalCanvas />
        </div>
      </div>
      <FloatingControls variant="sidebar" />
    </aside>
  )
}
