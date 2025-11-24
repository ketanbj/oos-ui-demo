import { TopBar } from './components/TopBar'
import { WorkloadScheduling } from './components/WorkloadScheduling'
import { OutageSplit } from './components/OutageSplit'
import { EnergyPanel } from './components/EnergyPanel'
import { OperatorPanel } from './components/OperatorPanel'
import { OrbitalPanel } from './components/OrbitalPanel'
import { PinnedHeader } from './components/PinnedHeader'
import { CollapsibleSection } from './components/CollapsibleSection'

function App() {
  return (
    <div className="min-h-screen bg-space-bg text-slate-100">
      <PinnedHeader />
      <div className="mx-auto max-w-[1600px] px-4 pb-6 pt-[260px] lg:pr-[620px]">
        <div className="flex flex-col gap-6">
          <OperatorPanel />
          <CollapsibleSection title="Workloads & scheduling" defaultOpen={false}>
            <WorkloadScheduling />
          </CollapsibleSection>
          <CollapsibleSection title="Reliability scenarios" defaultOpen={false}>
            <OutageSplit />
          </CollapsibleSection>
          <CollapsibleSection title="Energy awareness" defaultOpen={false}>
            <EnergyPanel />
          </CollapsibleSection>
        </div>
      </div>
      <OrbitalPanel />
    </div>
  )
}

export default App
