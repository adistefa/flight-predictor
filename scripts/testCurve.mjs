#!/usr/bin/env node
import { generateFlightPoints } from '../src/utils/flightModel.js'
import { projectFlightPoints } from '../src/utils/projection.js'

function angleBetween(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.atan2(dy, dx)
}

function maxAngleDelta(projected) {
  let maxDelta = 0
  for (let i = 2; i < projected.length; i++) {
    const s1 = projected[i - 2]
    const s2 = projected[i - 1]
    const s3 = projected[i]
    const dx1 = s2.x - s1.x
    const dy1 = s2.y - s1.y
    const dx2 = s3.x - s2.x
    const dy2 = s3.y - s2.y
    const len1 = Math.hypot(dx1, dy1)
    const len2 = Math.hypot(dx2, dy2)
    // ignore tiny segments (numerical noise)
    if (len1 < 0.5 || len2 < 0.5) continue
    const a1 = Math.atan2(dy1, dx1)
    const a2 = Math.atan2(dy2, dx2)
    let delta = Math.abs(a2 - a1)
    if (delta > Math.PI) delta = Math.abs(delta - Math.PI * 2)
    maxDelta = Math.max(maxDelta, delta)
  }
  return maxDelta
}

function runCase(disc, releaseAngle, launchAngle, label) {
  const pts = generateFlightPoints(disc, releaseAngle, launchAngle)
  const proj = projectFlightPoints(pts, 1080, 1920, 0, launchAngle)
  const maxDelta = maxAngleDelta(proj)
  console.log(`${label} - launchAngle=${launchAngle} -> projected points=${proj.length}, maxAngleDelta(deg)=${(maxDelta * 180/Math.PI).toFixed(2)}`)
}

// Disc presets from data/discs.js (fallback simple shapes)
const Escape = { speed: 9, glide: 5, turn: -1, fade: 2 }
const Fuse = { speed: 5, glide: 6, turn: -1, fade: 0 }
const Harp = { speed: 4, glide: 3, turn: 0, fade: 3 }

console.log('Curve smoothing test (max angular delta between neighbor segments)')
runCase(Escape, 0, 8, 'Escape(9/5/-1/2)')
runCase(Fuse, 0, 8, 'Fuse(5/6/-1/0)')
runCase(Harp, 0, 8, 'Harp(4/3/0/3)')

console.log('done')
