import { generateFlightPoints } from '../src/utils/flightModel.js'
import { discs } from '../src/data/discs.js'

function findDisc(id) {
  return discs.find(d => d.id === id)
}

function ensureKey(obj, key) {
  if (!(key in obj)) {
    throw new Error(`Expected key '${key}' not found on point. Actual keys: ${Object.keys(obj).join(', ')}`)
  }
}

function nearestByDistance(points, distanceKey, target) {
  let best = points[0]
  let bestIdx = 0
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const d = p[distanceKey]
    if (Math.abs(d - target) < Math.abs(best[distanceKey] - target)) {
      best = p
      bestIdx = i
    }
  }
  return { point: best, index: bestIdx }
}

function apexInfo(points, distanceKey, heightKey, maxDistanceMeters) {
  let maxH = -Infinity
  let idx = -1
  for (let i = 0; i < points.length; i++) {
    const h = points[i][heightKey]
    if (h > maxH) { maxH = h; idx = i }
  }
  const apexPoint = points[idx]
  const apexProgress = apexPoint[distanceKey] / maxDistanceMeters
  return { apexIndex: idx, apexHeight: maxH, apexProgress }
}

// --- Task 1: inspect actual point shape ---
const sampleDisc = findDisc('fuse')
if (!sampleDisc) throw new Error('Disc fuse not found')
const samplePoints = generateFlightPoints(sampleDisc, 0, 8)
console.log('\n--- Task 1: Inspect actual generated point shape ---')
if (samplePoints.length <= 10) {
  console.log('Not enough points returned by generateFlightPoints:', samplePoints.length)
  process.exit(1)
}
console.log('points[10] raw:')
console.log(samplePoints[10])
const actualKeys = Object.keys(samplePoints[10])
console.log('point keys:', actualKeys.join(', '))

// Determine required property names strictly from the object keys
if (!('height' in samplePoints[10])) {
  console.error('ERROR: Point does not contain required key "height". Aborting.')
  process.exit(1)
}

// distance key must be present; prefer 'distanceMeters'
const distanceKey = actualKeys.includes('distanceMeters') ? 'distanceMeters' : (actualKeys.includes('distance') ? 'distance' : null)
if (!distanceKey) {
  console.error('ERROR: No distance key found on point (expected distanceMeters or distance). Actual keys:', actualKeys)
  process.exit(1)
}
const heightKey = 'height'
const lateralKey = actualKeys.includes('lateral') ? 'lateral' : null

console.log(`Using keys -> distance: ${distanceKey}, height: ${heightKey}, lateral: ${lateralKey}`)

// --- Task 2/3/4: Repair tests and output raw points for Fuse -8° ---
const discFuse = findDisc('fuse')
const launchNeg = -8
const pointsFuseNeg = generateFlightPoints(discFuse, 0, launchNeg)
const maxDistanceFuse = 25 + (discFuse.speed || 6) * 6 + (discFuse.glide || 4) * 2.5

console.log('\n--- Task 3: Raw points for FUSE (launch -8°) ---')
const indices = [0, 1, 5, 10, 20, 35, 50, pointsFuseNeg.length - 1]
for (const idx of indices) {
  const p = pointsFuseNeg[idx]
  if (!p) {
    console.log(`index ${idx} -> (missing)`) 
    continue
  }
  ensureKey(p, distanceKey)
  ensureKey(p, heightKey)
  console.log(`point ${idx} -> distance=${p[distanceKey].toFixed(6)}, height=${p[heightKey].toFixed(6)}`)
}

// --- Task 4: Invariants ---
console.log('\n--- Task 4: Invariants for FUSE (launch -8°) ---')
const first = pointsFuseNeg[0]
const second = pointsFuseNeg[1]
ensureKey(first, heightKey)
ensureKey(second, heightKey)
console.log('points[0].height === 0 ->', first[heightKey] === 0)
console.log('points[1].height < 0 ->', second[heightKey] < 0)

let allIntermediateNonPositive = true
let anyIntermediateNonZero = false
const intermediateHeights = []
for (let i = 1; i < pointsFuseNeg.length - 1; i++) {
  const h = pointsFuseNeg[i][heightKey]
  intermediateHeights.push(h)
  if (h > 0) allIntermediateNonPositive = false
  if (Math.abs(h) > 1e-9) anyIntermediateNonZero = true
}
const maxIntermediateHeight = Math.max(...intermediateHeights)
const minIntermediateHeight = Math.min(...intermediateHeights)
console.log('maxIntermediateHeight =', maxIntermediateHeight)
console.log('minIntermediateHeight =', minIntermediateHeight)
console.log('all intermediate heights <= 0 ->', allIntermediateNonPositive)
console.log('some intermediate heights != 0 ->', anyIntermediateNonZero)
console.log('last point height === 0 ->', pointsFuseNeg[pointsFuseNeg.length - 1][heightKey] === 0)

// Sanity checks required in request
if (!(maxIntermediateHeight <= 0 && minIntermediateHeight < 0)) {
  console.error('\nInvariant FAILED for FUSE -8°: expected maxIntermediateHeight <= 0 and minIntermediateHeight < 0')
}

// --- Task 5: Compare Fuse vs Harp for negative launch at 10/25/50/75% ---
console.log('\n--- Task 5: Downhill Glide Comparison (FUSE vs HARP, launch -8°) ---')
function sampleAtFractions(points, distanceKey, maxDistance, fracs) {
  return fracs.map(f => {
    const target = f * maxDistance
    const { point, index } = nearestByDistance(points, distanceKey, target)
    return { frac: f, index, distance: point[distanceKey], height: point[heightKey] }
  })
}

const discHarp = findDisc('harp')
const pointsHarpNeg = generateFlightPoints(discHarp, 0, -8)
const maxDistanceHarp = 25 + (discHarp.speed || 6) * 6 + (discHarp.glide || 4) * 2.5
const fracs = [0.10, 0.25, 0.50, 0.75]

const fuseSamples = sampleAtFractions(pointsFuseNeg, distanceKey, maxDistanceFuse, fracs)
const harpSamples = sampleAtFractions(pointsHarpNeg, distanceKey, maxDistanceHarp, fracs)

console.log('FUSE -8° samples:')
for (const s of fuseSamples) console.log(`${(s.frac*100).toFixed(0)}% idx=${s.index} dist=${s.distance.toFixed(3)} height=${s.height.toFixed(6)}`)
console.log('HARP -8° samples:')
for (const s of harpSamples) console.log(`${(s.frac*100).toFixed(0)}% idx=${s.index} dist=${s.distance.toFixed(3)} height=${s.height.toFixed(6)}`)

// Assert none are positive
const fuseAnyPositive = fuseSamples.some(s => s.height > 0)
const harpAnyPositive = harpSamples.some(s => s.height > 0)
console.log('FUSE any positive after release?', fuseAnyPositive)
console.log('HARP any positive after release?', harpAnyPositive)

// --- Task 6: Positive flights apexes (+8°) ---
console.log('\n--- Task 6: Apex for positive launches (+8°) ---')
const posSamples = ['pure','fuse','harp','hades']
for (const id of posSamples) {
  const d = findDisc(id)
  const pts = generateFlightPoints(d, 0, 8)
  const maxD = 25 + (d.speed || 6) * 6 + (d.glide || 4) * 2.5
  const info = apexInfo(pts, distanceKey, heightKey, maxD)
  console.log(`${id.toUpperCase()} -> apexHeight=${info.apexHeight.toFixed(6)}, apexProgress=${(info.apexProgress*100).toFixed(2)}% (idx=${info.apexIndex})`)
}

// --- Task 7: Structural check of flightModel ---
console.log('\n--- Task 7: Structural check of flightModel ---')
let modelBroken = false
try {
  // quick smoke: ensure a couple of points have numeric distance and height
  const p0 = pointsFuseNeg[0]
  const p1 = pointsFuseNeg[1]
  if (typeof p0[distanceKey] !== 'number' || typeof p0[heightKey] !== 'number') modelBroken = true
  if (typeof p1[distanceKey] !== 'number' || typeof p1[heightKey] !== 'number') modelBroken = true
} catch (err) {
  modelBroken = true
}
console.log('flightModel structurally broken?', modelBroken ? 'YES' : 'NO')

console.log('\nDone.')
