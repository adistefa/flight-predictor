import { useEffect, useRef, useState } from 'react'

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

export default function useDeviceOrientation({ smoothing = 0.85, maxAngle = 30 } = {}) {
  const [rawPitch, setRawPitch] = useState(0)
  const smoothedRef = useRef(0)
  const [cameraPitchNormalized, setCameraPitchNormalized] = useState(0)
  const [available, setAvailable] = useState(!!window && 'DeviceOrientationEvent' in window)
  const [permissionNeeded, setPermissionNeeded] = useState(
    typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'
  )
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    let mounted = true

    function handle(e) {
      // Use `beta` for front/back tilt. Many devices supply `beta` in degrees.
      const beta = typeof e.beta === 'number' ? e.beta : 0

      // Normalize so that: camera DOWN -> negative, camera UP -> positive
      // We invert beta to try to match that convention and clamp around maxAngle
      const normalized = clamp((-beta) / maxAngle, -1, 1)

      setRawPitch(beta)

      // simple exponential smoothing
      smoothedRef.current = smoothedRef.current * smoothing + normalized * (1 - smoothing)
      if (mounted) setCameraPitchNormalized(smoothedRef.current)
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
    rawPitch,
    cameraPitchNormalized,
    requestPermissionNeeded: permissionNeeded && !granted,
    requestPermission,
    available,
  }
}
