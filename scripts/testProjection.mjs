import { generateFlightPoints } from '../src/utils/flightModel.js'
import { projectFlightPoints } from '../src/utils/projection.js'
import { discs } from '../src/data/discs.js'

const width = 1080
const height = 1920
const disc = discs.find(d=>d.id==='fuse')
const flightPoints = generateFlightPoints(disc, 0, 8)

function runTest(cameraPitch, launchAngle) {
  const projected = projectFlightPoints(flightPoints, width, height, cameraPitch, launchAngle)
  const first = projected[0]
  const last = projected[projected.length-1]
  console.log(JSON.stringify({ cameraPitch, launchAngle, projected0: { x: Number(first.x.toFixed(2)), y: Number(first.y.toFixed(2)) }, landingY: Number(last.y.toFixed(2)) }))
  return {projected, first, last}
}

console.log('--- test projectFlightPoints ---')
// cameraPitch tests
runTest(-1, 8)
runTest(0, 8)
runTest(1, 8)

// ensure release point independent of launchAngle
runTest(0, -8)
runTest(0, 0)
runTest(0, 8)
