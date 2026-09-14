import projectFlightPoints from '../utils/projection'

export class ProjectionDepthProvider {
  constructor() {}

  getDepthCapabilities() {
    return { provider: 'projection', supportsGroundPlane: true }
  }

  getGroundPlane() {
    return { type: 'estimated', description: 'ground plane estimated from projection model' }
  }

  // Project a ground point at distanceMeters along centerline
  projectGroundPoint(distanceMeters, width, height, cameraPitch = 0) {
    // build points so projection knows the total distance
    const pts = [
      { distanceMeters: 0, lateral: 0, height: 0 },
      { distanceMeters: distanceMeters, lateral: 0, height: 0 },
    ]
    const projected = projectFlightPoints(pts, width, height, cameraPitch)
    // projected[0] is release (forced), projected[1] is our ground point
    return projected[1]
  }

  // Return distance at screen point (best-effort using projection model)
  getDistanceAtScreenPoint(x, y, width, height, cameraPitch = 0, totalDistanceMeters = 100) {
    // Not a true depth test; find nearest marker along projection as estimate
    // We'll sample several depths and find the closest projected y
    const samples = 40
    let best = { meters: 0, dist: Infinity }
    for (let i = 0; i <= samples; i++) {
      const m = (i / samples) * totalDistanceMeters
      const p = this.projectGroundPoint(m, width, height, cameraPitch)
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < best.dist) best = { meters: m, dist: d }
    }
    return best.meters
  }
}

export default new ProjectionDepthProvider()
