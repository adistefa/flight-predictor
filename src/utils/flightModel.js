export function generateFlightPoints(
	disc,
	releaseAngle = 0,
	launchAngle = 8
) {
	const points = []
	const steps = 70

	const maxDistance =
		25 + (disc.speed || 6) * 6 + (disc.glide || 4) * 2.5

	// apex base influenced by launchAngle and glide
	const apexBase = 3 + (launchAngle / 6) + (disc.glide || 4) * 0.4

	for (let i = 0; i <= steps; i++) {
		const t = i / steps // 0..1

		// distance progression: ease-out so more points early
		const distance = maxDistance * Math.pow(t, 0.9)

		// height using sine curve, apex earlier around 0.45-0.6
		// make apex slightly earlier with higher launchAngle
		const heightFactor = Math.sin(Math.PI * t)
		const apex = apexBase * (1 + (disc.glide || 4) * 0.06)
		let height = Math.max(0, heightFactor * apex)

		// TURN: negative turn value -> move RIGHT (positive lateral) in player view
		const turnStart = 0.12
		const turnEnd = 0.65
		let turnEffect = 0
		if (t >= turnStart && t <= turnEnd) {
			const s = (t - turnStart) / (turnEnd - turnStart)
			const curve = Math.sin(s * Math.PI)
			// larger speed amplifies turn distance
			turnEffect = -disc.turn * curve * (0.6 + (disc.speed || 6) * 0.05)
		}

		// FADE: fades LEFT (negative lateral) late in flight
		const fadeStart = 0.65
		let fadeEffect = 0
		if (t >= fadeStart) {
			const s = (t - fadeStart) / (1 - fadeStart)
			const curve = Math.pow(s, 1.6)
			fadeEffect = -disc.fade * curve * (0.4 + (disc.speed || 6) * 0.02)
		}

		// RELEASE ANGLE: affects early flight (hyzer left negative, anhyzer right positive)
		const relStart = 0
		const relEnd = 0.45
		let releaseEffect = 0
		if (t >= relStart && t <= relEnd) {
			const s = 1 - (t - relStart) / (relEnd - relStart)
			const curve = Math.pow(s, 1.6)
			releaseEffect = -releaseAngle * 0.06 * curve
			// release angle modulates turn influence
			// positive releaseAngle (anhyzer) increases turn, negative reduces
		}

		// combine lateral components
		let lateral = turnEffect + fadeEffect + releaseEffect

		// add a small distance-based scaling so farther points can have slightly larger spread
		lateral = lateral * (0.9 + (distance / Math.max(1, maxDistance)) * 0.6)

		// height influenced strongly by launchAngle early on
		height = height * (1 + (launchAngle / 20))

		points.push({ distance, lateral, height })
	}

	return points
}

export default generateFlightPoints
