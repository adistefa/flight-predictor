export function generateFlightPoints(disc, releaseAngle = 0, launchAngle = 8) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }
  const smootherstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * t * (t * (t * 6 - 15) + 10)
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
      points.push({ distanceMeters: 0, lateral: 0, height: 0 })
      continue
    }

    const distance = maxDistanceMeters * Math.pow(t, 0.85)
    const distanceMeters = distance

    // normalized progress along actual distance (0..1)
    const tNorm = clamp(distanceMeters / maxDistanceMeters, 0, 1)

    // Turn / Fade overlap using smoother transitions (overlap rather than piecewise)
    const effectiveTurn = turnStrength * Math.max(0, 1 + releaseNormalized * 0.35)
    const turnWeight = smootherstep(0.05, 0.25, t) * (1 - smootherstep(0.55, 0.82, t))
    const fadeWeight = smootherstep(0.55, 0.92, t)
    const turnOffset = effectiveTurn * turnWeight * TURN_BASE_SCALE
    const fadeOffset = (disc.fade || 0) * Math.pow(fadeWeight, 1.7) * FADE_SCALE

    // RELEASE shaped effect: grows after ~0.05, peaks mid, then decays
    const releaseProgress = smootherstep(0.05, 0.35, t)
    const releaseDecay = 1 - smootherstep(0.35, 0.75, t)
    const releaseShape = releaseProgress * releaseDecay
    const releaseOffset = releaseNormalized * RELEASE_SCALE * releaseShape

    let lateral = turnOffset - fadeOffset + releaseOffset
    lateral = lateral * (1 + (disc.speed || 6) * 0.06)

    // -------------------------
    // Vertical multi-phase model
    // -------------------------
    // 1) glide normalization (disc.glide in ~1..7)
    const glideNormalized = clamp(((disc.glide || 4) - 1) / 6, 0, 1)

    // 2) launch tangent component (immediately affects initial slope)
    const LAUNCH_VERTICAL_SCALE = 0.018
    const launchRadians = (launchAngle * Math.PI) / 180
    const launchSlope = Math.sin(launchRadians)
    const launchComponent = launchSlope * distanceMeters * LAUNCH_VERTICAL_SCALE

    // helper to compute uncorrected height components for a given progress
    const RISE_END = 0.32
    const GLIDE_IN_START = 0.20
    const GLIDE_IN_END = 0.38
    const GLIDE_OUT_START = 0.62
    const GLIDE_OUT_END = 0.88

    function computeUncorrectedHeight(tP, distM) {
      // Rise phase (fast): t ~ 0 .. 0.32
      const riseProgress = smoothstep(0.0, RISE_END, tP)
      // Rise driven mainly by positive launch slope; slight boost from glide
      const riseBase = Math.max(0, launchSlope) * 8.6
      const riseGlideBoost = glideNormalized * 0.5
      const riseHeight = riseProgress * (riseBase + riseGlideBoost)

      // Glide/Hold phase — shaped by two smoothsteps
      const glideIn = smootherstep(GLIDE_IN_START, GLIDE_IN_END, tP)
      const glideOut = 1 - smootherstep(GLIDE_OUT_START, GLIDE_OUT_END, tP)
      const glideHold = glideIn * glideOut
      // Reduce direct glide lift — glide should mainly retain height, not create big apex
      const GLIDE_HEIGHT_SCALE = 0.7 // reduced: glide affects hold not apex height
      // For negative launches we do not add positive glide lift
      const glideLift = (launchAngle < 0) ? 0 : (glideHold * glideNormalized * GLIDE_HEIGHT_SCALE)

      // Descent: starts later when glide is high
      const descentStart = (0.55 * (1 - glideNormalized)) + (0.72 * glideNormalized) // lerp(0.55,0.72,glideNormalized)
      // smoother descent onset and progression
      const descentProgress = smootherstep(descentStart, 1.0, tP)
      // Descent strength reduced for higher glide (glide retains height)
      const baseDescentStrength = 3.6
      const descentStrengthMultiplier = (1.15 * (1 - glideNormalized)) + (0.80 * glideNormalized)
      const descentStrength = baseDescentStrength * descentStrengthMultiplier
      const descent = Math.pow(descentProgress, 1.5) * descentStrength

      // combine (note: launchComponent handled separately)
      // descent reduces height, glideLift and riseHeight add height
      const uncorrected = riseHeight + glideLift - descent
      return uncorrected
    }

    // precompute final uncorrected height for endpoint correction (t=1)
    const finalUncorrectedHeight = computeUncorrectedHeight(1, maxDistanceMeters) + (Math.sin((launchAngle * Math.PI) / 180) * maxDistanceMeters * LAUNCH_VERTICAL_SCALE)

    // compute uncorrected height at this point
    const uncorrectedHeight = computeUncorrectedHeight(tNorm, distanceMeters) + launchComponent

    // For negative launches use a downhill-specialized model: no positive lift,
    // glide reduces sink rate and extends the flat/downhill section.
    let height
    if (launchAngle < 0) {
      const baseDescent = 2.8
      const descentStrength = baseDescent * ((1 - glideNormalized) * 1.25 + glideNormalized * 0.7)
      const sinkProgress = smootherstep(0.0, 1.0, tNorm)
      const sink = Math.pow(sinkProgress, 1.2) * descentStrength
      // launchComponent is negative for negative launchAngle
      height = launchComponent - sink
      // reduce sink magnitude for higher glide (makes the down-slope flatter)
      height = height * (1 - glideNormalized * 0.15)
    } else {
      // endpoint correction: gently pull final trajectory to ground with smooth weight
      const correctionWeight = smootherstep(0.55, 1.0, tNorm)
      const endCorrection = finalUncorrectedHeight * correctionWeight
      height = uncorrectedHeight - endCorrection
    }

    // Make sure the final point is exactly ground-level
    if (i === steps) height = 0

    // For negative launches, never allow a positive height after release
    if (launchAngle < 0) {
      height = Math.min(height, 0)
    }

    // avoid extreme negative values (but allow some sink)
    const minHeight = -Math.abs(finalUncorrectedHeight) * 0.6
    if (Number.isFinite(minHeight)) height = Math.max(height, minHeight)

    // smoothly reduce lateral for very early flight (first ~5%) to avoid abrupt kick
    // earlyLock ramps 0 -> 1 across 0..0.05 so lateral is suppressed at t=0 and active after ~5%
    const earlyLock = smootherstep(0.0, 0.05, t)
    lateral = lateral * earlyLock

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
