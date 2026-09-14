import { useMemo, useState } from 'react'
import CameraView from './components/CameraView'
import FlightOverlay from './components/FlightOverlay'
import DiscSelector from './components/DiscSelector'
import DiscInfo from './components/DiscInfo'
import LaunchAngleControl from './components/LaunchAngleControl'
import ReleaseAngleControl from './components/ReleaseAngleControl'
import { discs as discsData } from './data/discs'
import useDeviceOrientation from './hooks/useDeviceOrientation'

export default function App() {
  const [selectedDiscId, setSelectedDiscId] = useState('escape')
  const [releaseAngle, setReleaseAngle] = useState(0)
  const [manualLaunchAngle, setManualLaunchAngle] = useState(8)
  const [launchMode, setLaunchMode] = useState('auto') // 'auto' | 'manual'

  const { cameraPitchNormalized, calibratedPitchDegrees, requestPermissionNeeded, requestPermission, calibrateLaunchZero, hasOrientationData, permissionState } = useDeviceOrientation()

  const effectiveLaunchAngle = launchMode === 'auto' && hasOrientationData && permissionState === 'granted' ? calibratedPitchDegrees : manualLaunchAngle

  const discs = discsData || []

  const selectedDisc = useMemo(() => discs.find((d) => d.id === selectedDiscId) || discs[0] || null, [discs, selectedDiscId])

  return (
    <div className="app-root">
      <CameraView />
      <FlightOverlay disc={selectedDisc} releaseAngle={releaseAngle} launchAngle={effectiveLaunchAngle} />

      <div className="ui-overlay">
        <div className="top-area" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <DiscSelector discs={discs} selectedDiscId={selectedDiscId} onSelect={setSelectedDiscId} />
        </div>

        <div className="center-top">
          <DiscInfo disc={selectedDisc} />
        </div>

        <div className="left-area" style={{ paddingLeft: 'env(safe-area-inset-left)' }}>
          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setLaunchMode('auto')} style={{ padding: '6px 8px', borderRadius: 6, background: launchMode === 'auto' ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#fff' }}>AUTO</button>
            <button onClick={() => setLaunchMode('manual')} style={{ padding: '6px 8px', borderRadius: 6, background: launchMode === 'manual' ? 'rgba(255,255,255,0.12)' : 'transparent', color: '#fff' }}>MANUAL</button>
            {launchMode === 'auto' && (
              <>
                <div style={{ marginLeft: 8 }}>{calibratedPitchDegrees ? `${calibratedPitchDegrees > 0 ? '+' : ''}${calibratedPitchDegrees.toFixed(0)}°` : '0°'}</div>
                <button onClick={() => calibrateLaunchZero()} style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6 }}>SET 0°</button>
              </>
            )}
          </div>
          <LaunchAngleControl value={manualLaunchAngle} onChange={setManualLaunchAngle} />
        </div>

        <div className="bottom-area" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <ReleaseAngleControl value={releaseAngle} onChange={setReleaseAngle} />
        </div>
      </div>

      {/* Temporary Motion Debug overlay */}
      <div style={{ position: 'fixed', right: 10, top: 10, zIndex: 9999, background: 'rgba(0,0,0,0.45)', color: '#fff', padding: 10, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
        <div><strong>MOTION DEBUG</strong></div>
        <div>perm: {permissionState}</div>
        <div>event: {hasOrientationData ? 'yes' : 'no'}</div>
        <div>cal: {calibratedPitchDegrees ? `${calibratedPitchDegrees.toFixed(2)}°` : '0.00°'}</div>
        <div>auto: {launchMode === 'auto' ? 'ON' : 'OFF'}</div>
      </div>
    </div>
  )
}
