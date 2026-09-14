import { useEffect, useRef, useState } from 'react'

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

export default function useDeviceOrientation({ smoothing = 0.85, launchSmoothing = 0.75, maxAngle = 30 } = {}) {
  const [rawPitchDegrees, setRawPitchDegrees] = useState(0)
  const smoothedRef = useRef(0)
  const [cameraPitchNormalized, setCameraPitchNormalized] = useState(0)
  const [available, setAvailable] = useState(!!window && 'DeviceOrientationEvent' in window)
  const [permissionNeeded, setPermissionNeeded] = useState(
    typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'
  )
  const [granted, setGranted] = useState(false)

  // launch calibration / smoothing
  const [launchZeroPitch, setLaunchZeroPitch] = useState(0)
  const [calibratedPitchDegrees, setCalibratedPitchDegrees] = useState(0)
  const launchSmoothedRef = useRef(0)

  useEffect(() => {
    let mounted = true

    function handle(e) {
      // Use `beta` for front/back tilt. Many devices supply `beta` in degrees.
      const beta = typeof e.beta === 'number' ? e.beta : 0

      // raw degrees
      setRawPitchDegrees(beta)

      // Normalize for perspective: camera DOWN -> negative, camera UP -> positive
      const normalized = clamp((-beta) / maxAngle, -1, 1)
      smoothedRef.current = smoothedRef.current * smoothing + normalized * (1 - smoothing)
      if (mounted) setCameraPitchNormalized(smoothedRef.current)

      // calibrated launch degrees (raw minus zero) and smoothing
      const calibrated = beta - (launchZeroPitch || 0)
      // clamp to -15..30
      const clampedCal = clamp(calibrated, -15, 30)
      // smoothing for launch angle
      launchSmoothedRef.current = launchSmoothedRef.current * launchSmoothing + clampedCal * (1 - launchSmoothing)
      const withDeadzone = Math.abs(launchSmoothedRef.current) <= 0.75 ? 0 : launchSmoothedRef.current
      if (mounted) setCalibratedPitchDegrees(withDeadzone)
    }

    function attach() {
      if (!('DeviceOrientationEvent' in window)) return
      window.addEventListener('deviceorientation', handle, { passive: true })
      setAvailable(true)
    }

    // If permission is required but not yet granted, do not attach automatically
    if (permissionNeeded && !granted) {
      // wait for user to call requestPermission
    } else {
      attach()
      setGranted(true)
    }

    return () => {
      mounted = false
      window.removeEventListener('deviceorientation', handle)
    }
  }, [permissionNeeded, granted, smoothing, maxAngle])

  async function requestPermission() {
    if (typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') {
      return false
    }
    try {
      const result = await DeviceOrientationEvent.requestPermission()
      if (result === 'granted') {
        setGranted(true)
        setPermissionNeeded(false)
        // attach listener by toggling effect
        const ev = new Event('deviceorientation')
        window.dispatchEvent(ev)
        return true
      }
    } catch (err) {
      // permission denied or not supported
    }
    return false
  }

  return {
    rawPitchDegrees,
    cameraPitchNormalized,
    calibratedPitchDegrees,
    requestPermissionNeeded: permissionNeeded && !granted,
    requestPermission,
    available,
    calibrateLaunchZero: () => setLaunchZeroPitch(rawPitchDegrees),
  }
}
