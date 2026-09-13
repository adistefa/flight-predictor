import { useEffect, useMemo, useState } from 'react'
import { generateFlightPoints } from '../utils/flightModel'
import { projectFlightPoints } from '../utils/projection'

export default function FlightOverlay({ disc, releaseAngle, launchAngle }) {
	const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

	useEffect(() => {
		function onResize() {
			setSize({ w: window.innerWidth, h: window.innerHeight })
		}
		window.addEventListener('resize', onResize)
		return () => window.removeEventListener('resize', onResize)
	}, [])

	const flightPoints = useMemo(() => {
		if (!disc) return []
		return generateFlightPoints(disc, releaseAngle, launchAngle)
	}, [disc, releaseAngle, launchAngle])

	const projected = useMemo(() => projectFlightPoints(flightPoints, size.w, size.h), [flightPoints, size])

	if (!projected || projected.length === 0) return null

	const start = projected[0]
	const end = projected[projected.length - 1]

	// split into near/mid/far segments for subtle width change
	const len = projected.length
	const n1 = Math.floor(len * 0.33)
	const n2 = Math.floor(len * 0.66)

	const segmentPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')

	const nearPath = segmentPath(projected.slice(0, n1 + 1))
	const midPath = segmentPath(projected.slice(n1, n2 + 1))
	const farPath = segmentPath(projected.slice(n2, projected.length))

	// depth markers at 25/50/75%
	const markers = []
	if (len > 3) {
		markers.push(projected[Math.floor(len * 0.25)])
		markers.push(projected[Math.floor(len * 0.5)])
		markers.push(projected[Math.floor(len * 0.75)])
	}

	return (
		<svg className="flight-overlay" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
			<defs>
				<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="6" result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			<g style={{ filter: 'url(#glow)' }}>
				{nearPath && <path d={nearPath} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />}
				{midPath && <path d={midPath} fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />}
				{farPath && <path d={farPath} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth={2.0} strokeLinecap="round" strokeLinejoin="round" />}
			</g>

			{/* start and landing markers */}
			<circle cx={start.x} cy={start.y} r={5} fill="#fff" opacity={0.95} />
			{/* landing ring: clear, below horizon */}
			<circle cx={end.x} cy={end.y} r={6} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.4} opacity={0.9} />

			{/* depth markers at 25/50/75% */}
			{markers.map((m, i) => (
				<circle key={`m-${i}`} cx={m.x} cy={m.y} r={3} fill="rgba(255,255,255,0.14)" />
			))}
		</svg>
	)
}
