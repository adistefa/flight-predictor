export function projectFlightPoints(flightPoints, width, height) {
	if (!flightPoints || flightPoints.length === 0) return []

	const maxDistance = Math.max(...flightPoints.map((p) => p.distance)) || 1

	const centerX = width / 2
	const startY = height * 0.82
	const horizonY = height * 0.35

	const lateralScale = Math.min(width, 900) * 0.02
	const heightScale = Math.min(height, 1200) * 0.18

	return flightPoints.map((p) => {
		const depth = Math.min(1, Math.max(0, p.distance / maxDistance))

		const groundY = startY + (horizonY - startY) * depth
		const perspective = 1 - depth * 0.55

		const x = centerX + p.lateral * lateralScale * perspective
		const y = groundY - p.height * heightScale * perspective

		return { x, y, depth }
	})
}

export default projectFlightPoints
