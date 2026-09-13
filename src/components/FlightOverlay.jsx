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

	const pathD = projected.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')

	const start = projected[0]
	const end = projected[projected.length - 1]

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
				<path d={pathD} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
			</g>

			{/* start and end markers */}
			<circle cx={start.x} cy={start.y} r={5} fill="#fff" opacity={0.95} />
			<circle cx={end.x} cy={end.y} r={3} fill="#fff" opacity={0.9} />

			{/* subtle points */}
			{projected.map((p, i) => (i % 10 === 0 ? <circle key={i} cx={p.x} cy={p.y} r={2} fill="rgba(255,255,255,0.12)" /> : null))}
		</svg>
	)
}
