export function projectFlightPoints(flightPoints, width, height, cameraPitch = 0, launchAngle = 8) {
	if (!flightPoints || flightPoints.length === 0) return []

	const maxDistance = Math.max(...flightPoints.map((p) => p.distanceMeters || p.distance || 0)) || 1

	const centerX = width * 0.5
	const releaseY = height * 0.78
	const horizonY = height * 0.30
	const baseFarGroundY = height * 0.64

	// stronger lateral and taller height to emphasize depth over height
	// UPDATED: increase visual size (~2.5x) per design request
	const lateralScale = width * 0.1875
	const heightScale = height * 0.055

	const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
	const smoothstep = (edge0, edge1, x) => {
		const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
		return t * t * (3 - 2 * t)
	}

	// pitch modifies the perceived depth/ground plane without changing physics
	const pitchDepthFactor = clamp(1 - cameraPitch * 0.25, 0.6, 1.4)

	// dynamic farGroundY influenced by camera pitch
	const pitchOffset = cameraPitch * height * 0.10
	// incorporate launchAngle for downhill throws (negative launchAngles)
	const launchOffset = (launchAngle < 0) ? Math.min(Math.abs(launchAngle) / 15, 1) * height * 0.27 : 0
	const farGroundY = clamp(baseFarGroundY + pitchOffset + launchOffset, height * 0.52, height * 0.92)

	function getLandingY() {
		const baseLanding = baseFarGroundY
		const pitchOff = pitchOffset * 0.8 // slightly reduced effect here
		let launchOff = 0
		if (launchAngle < 0) {
			const downhill = Math.min(Math.abs(launchAngle) / 15, 1)
			launchOff = downhill * height * 0.27
		}
		return clamp(baseLanding + pitchOff + launchOff, height * 0.52, height * 0.92)
	}

	return flightPoints.map((p, index) => {
		const depth = Math.min(1, Math.max(0, (p.distanceMeters || p.distance || 0) / maxDistance))

		// optionally adjust depth slightly by pitch to add extra effect
		const adjustedDepth = clamp(depth * pitchDepthFactor, 0, 1)

		// stronger non-linear compression to push feeling into depth
		const visualDepth = 1 - Math.pow(1 - adjustedDepth, 2.2)

		// Force exact release screen coordinate for the first point by index
		if (index === 0) {
			return { x: centerX, y: releaseY, depth: 0 }
		}

		// map ground to a landingY (below horizon) so landing stays visible
		const landingY = getLandingY()
		const groundY = releaseY + (landingY - releaseY) * visualDepth

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
