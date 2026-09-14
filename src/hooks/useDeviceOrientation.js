import { useEffect, useRef, useState } from 'react'

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

export default function useDeviceOrientation({ smoothing = 0.85, launchSmoothing = 0.75, maxAngle = 30 } = {}) {
  const [rawPitchDegrees, setRawPitchDegrees] = useState(0)
  const latestRawPitchRef = useRef(0)
  const smoothedRef = useRef(0)
  const [cameraPitchNormalized, setCameraPitchNormalized] = useState(0)

  const [permissionState, setPermissionState] = useState('unknown') // 'unknown'|'granted'|'denied'
  const [hasOrientationData, setHasOrientationData] = useState(false)

  // calibration refs
  const zeroPitchRef = useRef(null)
  const [calibratedPitchDegrees, setCalibratedPitchDegrees] = useState(0)
  const launchSmoothedRef = useRef(0)

  useEffect(() => {
    let mounted = true

    function handle(e) {
      const beta = typeof e.beta === 'number' ? e.beta : 0
      const gamma = typeof e.gamma === 'number' ? e.gamma : 0

      // log every event for debugging
      // eslint-disable-next-line no-console
      console.log('orientation event', { alpha: e.alpha, beta, gamma })

      // update latest raw
      latestRawPitchRef.current = beta
      setRawPitchDegrees(beta)

      // mark that we have received at least one event
      if (!hasOrientationData) setHasOrientationData(true)

      // perspective normalized (do NOT invert blindly)
      const normalized = clamp((-beta) / maxAngle, -1, 1)
      smoothedRef.current = smoothedRef.current * smoothing + normalized * (1 - smoothing)
      if (mounted) setCameraPitchNormalized(smoothedRef.current)

      // calibrated launch degrees
      const zero = zeroPitchRef.current != null ? zeroPitchRef.current : beta
      let calibrated = beta - zero
      calibrated = clamp(calibrated, -15, 30)
      // dead zone
      if (Math.abs(calibrated) <= 0.75) calibrated = 0
      // smoothing for launch
      launchSmoothedRef.current = launchSmoothedRef.current * launchSmoothing + calibrated * (1 - launchSmoothing)
      const smoothedLaunch = launchSmoothedRef.current
      if (mounted) setCalibratedPitchDegrees(smoothedLaunch)
    }

    function attachListener() {
      if (!('DeviceOrientationEvent' in window)) return
      // use capture true per instructions
      window.addEventListener('deviceorientation', handle, true)
    }

    // Attach if permission granted or not required
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS-like: only attach after explicit grant
      if (permissionState === 'granted') attachListener()
    } else {
      // no permission API -> attach directly
      attachListener()
      setPermissionState('granted')
    }

    return () => {
      mounted = false
      try {
        window.removeEventListener('deviceorientation', handle, true)
      } catch (e) {}
    }
    // intentionally exclude zeroPitchRef and latestRawPitchRef to avoid reattaching
  }, [permissionState, smoothing, launchSmoothing, maxAngle, hasOrientationData])

  async function requestPermission() {
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
      setPermissionState('denied')
      return false
    }
    try {
      const result = await DeviceOrientationEvent.requestPermission()
      if (result === 'granted') {
        setPermissionState('granted')
        // attach listener now
        const ev = new Event('deviceorientation')
        window.dispatchEvent(ev)
        return true
      }
      setPermissionState('denied')
    } catch (err) {
      setPermissionState('denied')
    }
    return false
  }

  function calibrateLaunchZero() {
    // use latest raw pitch ref for robust calibration
    zeroPitchRef.current = latestRawPitchRef.current
  }

  return {
    rawPitchDegrees: latestRawPitchRef.current,
    cameraPitchNormalized,
    calibratedPitchDegrees,
    permissionState,
    requestPermissionNeeded: permissionState === 'unknown',
    requestPermission,
    hasOrientationData,
    calibrateLaunchZero,
  }
}
