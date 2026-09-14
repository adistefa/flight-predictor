import { discs } from '../src/data/discs.js'
import generateFlightPoints from '../src/utils/flightModel.js'
import projectFlightPoints from '../src/utils/projection.js'

const disc = discs.find((d) => d.id === 'escape')
if (!disc) {
  console.error('Disc escape not found')
  process.exit(1)
}

const width = 1920
const height = 1080
const launchAngle = 8

const angles = [-30, 0, 30]
const cameraPitches = [-1, 0, 1]

for (const cp of cameraPitches) {
  console.log('--- cameraPitch', cp, '---')
  for (const a of angles) {
    const pts = generateFlightPoints(disc, a, launchAngle)
    const projected = projectFlightPoints(pts, width, height, cp)
    const p0 = projected[0]
    console.log('releaseAngle', a, '=>', p0.x.toFixed(3), p0.y.toFixed(3))
  }
}
