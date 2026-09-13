export function projectFlightPoints(flightPoints, width, height) {
	if (!flightPoints || flightPoints.length === 0) return []

	const maxDistance = Math.max(...flightPoints.map((p) => p.distance)) || 1

	const centerX = width * 0.5
	const releaseY = height * 0.78
	const horizonY = height * 0.30
	const farGroundY = height * 0.60

	// stronger lateral and smaller height to emphasize depth over height
	const lateralScale = width * 0.05
	const heightScale = height * 0.013

	return flightPoints.map((p) => {
		const depth = Math.min(1, Math.max(0, p.distance / maxDistance))

		// stronger non-linear compression to push feeling into depth
		const visualDepth = 1 - Math.pow(1 - depth, 2.2)

		// map ground to a farGroundY (below horizon) so landing stays visible
		const groundY = releaseY + (farGroundY - releaseY) * visualDepth

		// perspective factor reduces lateral/height with depth
		const perspective = 1 - visualDepth * 0.45

		const x = centerX + p.lateral * lateralScale * perspective
		const y = groundY - p.height * heightScale * perspective

		return { x, y, depth }
	})
}

export default projectFlightPoints
