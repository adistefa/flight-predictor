#!/usr/bin/env node
import { generateFlightPoints } from '../src/utils/flightModel.js'
import { projectFlightPoints } from '../src/utils/projection.js'
import { discs } from '../src/data/discs.js'

function findDisc(id){ return discs.find(d=>d.id===id)}

const width = 1080
const height = 1920
const cameraPitch = 0

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))
const smootherstep = (edge0,edge1,x)=>{const t=clamp((x-edge0)/(edge1-edge0),0,1);return t*t*t*(t*(t*6-15)+10)}

function analyze(discId, releaseAngle=0, launchAngle=8){
  const disc = findDisc(discId)
  if(!disc) { console.error('disc not found',discId); return }
  const pts = generateFlightPoints(disc, releaseAngle, launchAngle)
  const maxDistance = Math.max(...pts.map(p=>p.distanceMeters||p.distance||0))||1
  const centerX = width*0.5
  const lateralScale = width*0.1875
  const pitchDepthFactor = clamp(1 - cameraPitch * 0.25, 0.6, 1.4)

  const indices = [0,10,20,35,50,60,70]
  console.log('\n--- Analysis for',discId,'launchAngle=',launchAngle,'---')
  for(const idx of indices){
    const p = pts[idx]
    if(!p){ console.log('index',idx,'missing'); continue }
    const distance = p.distanceMeters || p.distance || 0
    const depth = Math.min(1, Math.max(0, distance / maxDistance))
    const adjustedDepth = clamp(depth * pitchDepthFactor, 0, 1)
    const visualDepth = 1 - Math.pow(1 - adjustedDepth, 2.2)
    const perspective = 1 - visualDepth * 0.45
    const lateral = p.lateral
    const lateralPixelOffset = lateral * lateralScale * perspective
    const projectedX = centerX + lateralPixelOffset
    const originLock = 1 - smootherstep(0.0, 0.06, depth)
    const xFinal = centerX * originLock + projectedX * (1 - originLock)

    console.log(`idx=${idx}`,{
      distance: Number(distance.toFixed(4)),
      lateral: Number(lateral?.toFixed(6)),
      lateralScale: Number(lateralScale.toFixed(4)),
      perspective: Number(perspective.toFixed(6)),
      lateralPixelOffset: Number(lateralPixelOffset.toFixed(4)),
      projectedX: Number(projectedX.toFixed(4)),
      originLock: Number(originLock.toFixed(4)),
      xFinal: Number(xFinal.toFixed(4))
    })
  }

  const projected = projectFlightPoints(pts, width, height, cameraPitch, launchAngle)
  const xs = projected.map(p=>p.x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const spreadX = maxX - minX
  console.log('summary:',{releaseX:centerX,minX:Number(minX.toFixed(4)),maxX:Number(maxX.toFixed(4)),spreadX:Number(spreadX.toFixed(4))})

  return {pts,projected}
}

// Run for Escape, Fuse, Harp
analyze('escape',0,8)
analyze('fuse',0,8)
analyze('harp',0,8)

console.log('\nDone')
