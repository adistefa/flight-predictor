#!/usr/bin/env node
import { generateFlightPoints } from '../src/utils/flightModel.js'
import { projectFlightPoints } from '../src/utils/projection.js'

const disc = { speed: 9, glide: 5, turn: -1, fade: 2 }
const releaseAngle = 0
const launches = [-8, 0, 8]

for (const launchAngle of launches) {
  const points = generateFlightPoints(disc, releaseAngle, launchAngle)
  const projected = projectFlightPoints(points, 1080, 1920, 0, launchAngle)
  const safePts = projected.filter(p => Number.isFinite(p?.x) && Number.isFinite(p?.y))
  const flightPath = safePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  console.log('DEBUG RUN', { launchAngle, rawCount: points.length, projectedCount: projected.length, first: projected[0], middle: projected[Math.floor(projected.length/2)], last: projected[projected.length-1], pathLength: flightPath.length, pathStart: flightPath.slice(0,120) })
}
