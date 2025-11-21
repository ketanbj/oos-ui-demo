import { TopBar } from './components/TopBar'
import { OverviewDashboard } from './components/OverviewDashboard'
import { WorkloadScheduling } from './components/WorkloadScheduling'
import { OutageSplit } from './components/OutageSplit'
import { EnergyPanel } from './components/EnergyPanel'
import { OperatorPanel } from './components/OperatorPanel'
import { FloatingControls } from './components/FloatingControls'

function App() {
  return (
    <div className="min-h-screen bg-space-bg text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <TopBar />
        <OverviewDashboard />
        <WorkloadScheduling />
        <OutageSplit />
        <EnergyPanel />
        <OperatorPanel />
      </div>
      <FloatingControls />
    </div>
  )
}

export default App
