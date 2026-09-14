export function generateFlightPoints(disc, releaseAngle = 0, launchAngle = 8) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }

  const points = []
  const steps = 70

  const maxDistanceMeters = 25 + (disc.speed || 6) * 6 + (disc.glide || 4) * 2.5

  const TURN_START = 0.08
  const TURN_END = 0.62
  const GLIDE_START = 0.35
  const GLIDE_END = 0.75
  const FADE_START = 0.62

  const TURN_BASE_SCALE = 1 + (disc.speed || 6) * 0.08
  const FADE_SCALE = 0.9 + (disc.speed || 6) * 0.03
  const RELEASE_SCALE = 0.9

  const releaseNormalized = clamp(releaseAngle / 30, -1, 1)
  const turnStrength = Math.abs(Math.min(disc.turn || 0, 0))

  for (let i = 0; i <= steps; i++) {
    const t = i / steps

    // enforce exact origin at t=0
    if (i === 0) {
      points.push({ distance: 0, lateral: 0, height: 0 })
      continue
    }

    const distance = maxDistanceMeters * Math.pow(t, 0.85)
    const distanceMeters = distance

    // Turn starts later to keep the release visually stable
    const turnProgress = smoothstep(TURN_START, TURN_END, t)
    const effectiveTurn = turnStrength * Math.max(0, 1 + releaseNormalized * 0.35)
    const turnOffset = effectiveTurn * turnProgress * TURN_BASE_SCALE

    const fadeProgress = smoothstep(FADE_START, 1.0, t)
    const fadeOffset = (disc.fade || 0) * Math.pow(fadeProgress, 1.7) * FADE_SCALE

    // RELEASE shaped effect: grows after ~0.05, peaks mid, then decays
    const releaseProgress = smoothstep(0.05, 0.35, t)
    const releaseDecay = 1 - smoothstep(0.35, 0.75, t)
    const releaseShape = releaseProgress * releaseDecay
    const releaseOffset = releaseNormalized * RELEASE_SCALE * releaseShape

    let lateral = turnOffset - fadeOffset + releaseOffset
    lateral = lateral * (1 + (disc.speed || 6) * 0.06)

    const apexT = clamp(0.45 + (launchAngle - 8) / 200, 0.4, 0.55)
    const baseApex = 1.2 + (launchAngle / 7) + (disc.glide || 4) * 0.18

    // launch vertical component: allow negative launch angles (downhill throws)
    const LAUNCH_VERTICAL_SCALE = 0.02
    const launchRadians = (launchAngle * Math.PI) / 180
    const launchSlope = Math.sin(launchRadians) // negative if launchAngle negative
    const launchVertical = launchSlope * distance * LAUNCH_VERTICAL_SCALE
    let height = 0
    if (t <= apexT) {
      const p = t / apexT
      height = Math.pow(p, 1.45) * baseApex
    } else {
      const p = (t - apexT) / (1 - apexT)
      height = Math.pow(1 - p, 1.05) * baseApex * 0.98
    }

    const glideHold = smoothstep(GLIDE_START, GLIDE_END, t)
    height = height * (1 + glideHold * 0.3)

    // combine with launch vertical tendency (downhill/uphill)
    height = height + launchVertical

    // prevent extreme negative heights so the disc doesn't vanish below ground
    const minHeight = -Math.abs(baseApex) * 0.6
    height = Math.max(height, minHeight)

    // ensure near-zero lateral for very early flight (first ~5%)
    if (t <= 0.05) lateral = 0

    points.push({ distanceMeters, lateral, height })
  }

  return points
}

export function estimateFlightDistance(disc, power = 1) {
  // Simple heuristic: base + speed * factor + glide influence, scaled by power
  const base = 25
  const speedFactor = (disc.speed || 6) * 6
  const glideFactor = (disc.glide || 4) * 2.5
  const estimate = (base + speedFactor + glideFactor) * power
  return Math.max(10, estimate)
}

export { generateFlightPoints as default }
