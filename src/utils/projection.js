export function projectFlightPoints(flightPoints, width, height) {
	if (!flightPoints || flightPoints.length === 0) return []

	const maxDistance = Math.max(...flightPoints.map((p) => p.distance)) || 1

	const centerX = width * 0.5
	const releaseY = height * 0.76
	const horizonY = height * 0.32

	const lateralScale = width * 0.035
	const heightScale = height * 0.025

	return flightPoints.map((p) => {
		const depth = Math.min(1, Math.max(0, p.distance / maxDistance))

		// non-linear visual depth compression
		const visualDepth = 1 - Math.pow(1 - depth, 1.6)

		const groundY = releaseY + (horizonY - releaseY) * visualDepth
		const perspective = 1 - visualDepth * 0.6

		const x = centerX + p.lateral * lateralScale * perspective
		const y = groundY - p.height * heightScale * perspective

		return { x, y, depth }
	})
}

export default projectFlightPoints
