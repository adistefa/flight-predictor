export function generateFlightPoints(disc, releaseAngle = 0, launchAngle = 8) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }

  const points = []
  const steps = 70

  const maxDistance = 25 + (disc.speed || 6) * 6 + (disc.glide || 4) * 2.5

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

    const distance = maxDistance * (t === 0 ? 0 : Math.pow(t, 0.85))

    const turnProgress = smoothstep(TURN_START, TURN_END, t)
    const effectiveTurn = turnStrength * Math.max(0, 1 + releaseNormalized * 0.35)
    const turnOffset = effectiveTurn * turnProgress * TURN_BASE_SCALE

    const fadeProgress = smoothstep(FADE_START, 1.0, t)
    const fadeOffset = (disc.fade || 0) * Math.pow(fadeProgress, 1.7) * FADE_SCALE

    let releaseOffset = 0
    if (t <= 0.45) {
      const relp = 1 - t / 0.45
      releaseOffset = releaseNormalized * RELEASE_SCALE * Math.pow(relp, 1.4)
    }

    let lateral = turnOffset - fadeOffset + releaseOffset
    lateral = lateral * (1 + (disc.speed || 6) * 0.06)

    const apexT = clamp(0.45 + (launchAngle - 8) / 200, 0.4, 0.55)
    const baseApex = 2.3 + (launchAngle / 5) + (disc.glide || 4) * 0.28
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

    points.push({ distance, lateral, height })
  }

  return points
}

export default generateFlightPoints
