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

  // Handler that must run requestPermission() directly from a user gesture
  const handleEnableMotion = async () => {
    try {
      const result = await requestPermission()
      // eslint-disable-next-line no-console
      console.log('motion permission result:', result)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('requestPermission error', err)
    }
  }

  const effectiveLaunchAngle = launchMode === 'auto' && hasOrientationData && permissionState === 'granted' ? calibratedPitchDegrees : manualLaunchAngle

  const discs = discsData || []

  const selectedDisc = useMemo(() => discs.find((d) => d.id === selectedDiscId) || discs[0] || null, [discs, selectedDiscId])

  // compute human-friendly AUTO status for debug UI
  const autoStatus = (() => {
    if (launchMode !== 'auto') return 'OFF'
    if (permissionState === 'granted' && hasOrientationData === true) return 'ON'
    if (permissionState === 'unknown') return 'WAITING'
    if (permissionState === 'denied') return 'UNAVAILABLE'
    return 'WAITING'
  })()

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

            {/* ENABLE MOTION: visible when permission API requires explicit user gesture */}
            {requestPermissionNeeded && permissionState === 'unknown' && (
              <button onClick={handleEnableMotion} style={{ marginLeft: 4, padding: '6px 8px', borderRadius: 6, background: '#1976d2', color: '#fff', fontWeight: 600 }}>ENABLE MOTION</button>
            )}

            {launchMode === 'auto' && (
              <>
                <div style={{ marginLeft: 8 }}>{calibratedPitchDegrees ? `${calibratedPitchDegrees > 0 ? '+' : ''}${calibratedPitchDegrees.toFixed(0)}°` : '0°'}</div>
                {/* SET 0° only enabled when we have permission and at least one event */}
                {(() => {
                  const canCalibrate = permissionState === 'granted' && hasOrientationData === true
                  return (
                    <button
                      onClick={() => canCalibrate && calibrateLaunchZero()}
                      disabled={!canCalibrate}
                      style={{
                        marginLeft: 8,
                        padding: '4px 8px',
                        borderRadius: 6,
                        opacity: canCalibrate ? 1 : 0.45,
                        cursor: canCalibrate ? 'pointer' : 'default',
                      }}
                    >
                      SET 0°
                    </button>
                  )
                })()}
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
        <div>auto: {autoStatus}</div>
      </div>
    </div>
  )
}
