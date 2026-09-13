import { useMemo, useState } from 'react'
import CameraView from './components/CameraView'
import FlightOverlay from './components/FlightOverlay'
import DiscSelector from './components/DiscSelector'
import DiscInfo from './components/DiscInfo'
import LaunchAngleControl from './components/LaunchAngleControl'
import ReleaseAngleControl from './components/ReleaseAngleControl'
import { discs as discsData } from './data/discs'

export default function App() {
  const [selectedDiscId, setSelectedDiscId] = useState('escape')
  const [releaseAngle, setReleaseAngle] = useState(0)
  const [launchAngle, setLaunchAngle] = useState(8)

  const discs = discsData || []

  const selectedDisc = useMemo(() => discs.find((d) => d.id === selectedDiscId) || discs[0] || null, [discs, selectedDiscId])

  return (
    <div className="app-root">
      <CameraView />
      <FlightOverlay disc={selectedDisc} releaseAngle={releaseAngle} launchAngle={launchAngle} />

      <div className="ui-overlay">
        <div className="top-area" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <DiscSelector discs={discs} selectedDiscId={selectedDiscId} onSelect={setSelectedDiscId} />
        </div>

        <div className="center-top">
          <DiscInfo disc={selectedDisc} />
        </div>

        <div className="left-area" style={{ paddingLeft: 'env(safe-area-inset-left)' }}>
          <LaunchAngleControl value={launchAngle} onChange={setLaunchAngle} />
        </div>

        <div className="bottom-area" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ReleaseAngleControl value={releaseAngle} onChange={setReleaseAngle} />
        </div>
      </div>
    </div>
  )
}
