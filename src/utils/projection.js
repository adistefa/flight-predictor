export function projectFlightPoints(flightPoints, width, height, cameraPitch = 0) {
	if (!flightPoints || flightPoints.length === 0) return []

	const maxDistance = Math.max(...flightPoints.map((p) => p.distance)) || 1

	const centerX = width * 0.5
	const releaseY = height * 0.78
	const horizonY = height * 0.30
	const baseFarGroundY = height * 0.60

	// stronger lateral and smaller height to emphasize depth over height
	const lateralScale = width * 0.05
	const heightScale = height * 0.013

	const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
	const smoothstep = (edge0, edge1, x) => {
		const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
		return t * t * (3 - 2 * t)
	}

	// pitch modifies the perceived depth/ground plane without changing physics
	const pitchDepthFactor = clamp(1 - cameraPitch * 0.25, 0.6, 1.4)

	// dynamic farGroundY influenced by camera pitch
	const pitchOffset = cameraPitch * height * 0.10
	const farGroundY = clamp(baseFarGroundY + pitchOffset, height * 0.48, height * 0.70)

	return flightPoints.map((p, index) => {
		const depth = Math.min(1, Math.max(0, p.distance / maxDistance))

		// optionally adjust depth slightly by pitch to add extra effect
		const adjustedDepth = clamp(depth * pitchDepthFactor, 0, 1)

		// stronger non-linear compression to push feeling into depth
		const visualDepth = 1 - Math.pow(1 - adjustedDepth, 2.2)

		// Force exact release screen coordinate for the first point by index
		if (index === 0) {
			return { x: centerX, y: releaseY, depth: 0 }
		}

		// map ground to a farGroundY (below horizon) so landing stays visible
		const groundY = releaseY + (farGroundY - releaseY) * visualDepth

		// perspective factor reduces lateral/height with depth
		const perspective = 1 - visualDepth * 0.45

		// normal projected positions
		const projectedX = centerX + p.lateral * lateralScale * perspective
		const projectedY = groundY - p.height * heightScale * perspective

		// origin lock for first ~5% of flight to avoid any visible shift
		const originLock = 1 - smoothstep(0.0, 0.05, depth)

		const x = centerX * originLock + projectedX * (1 - originLock)
		const y = releaseY * originLock + projectedY * (1 - originLock)

		return { x, y, depth }
	})
}

export default projectFlightPoints
