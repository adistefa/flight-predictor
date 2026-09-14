import { useEffect, useMemo, useState } from 'react'
import { generateFlightPoints, estimateFlightDistance } from '../utils/flightModel'
import { projectFlightPoints } from '../utils/projection'
import useDeviceOrientation from '../hooks/useDeviceOrientation'

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

	const { cameraPitchNormalized, requestPermissionNeeded, requestPermission } = useDeviceOrientation()

	const projected = useMemo(
		() => projectFlightPoints(flightPoints, size.w, size.h, cameraPitchNormalized, launchAngle),
		[flightPoints, size, cameraPitchNormalized, launchAngle]
	)

	if (!projected || projected.length === 0) return null

	const start = projected[0]
	const end = projected[projected.length - 1]

	// split into near/mid/far segments for subtle width change
	const len = projected.length
	const n1 = Math.floor(len * 0.33)
	const n2 = Math.floor(len * 0.66)

		// Convert points to a smoothed SVG path using Catmull-Rom -> cubic Bezier
		const catmullRom2bezier = (pts, tension = 0.5) => {
			if (!pts || pts.length === 0) return ''
			if (pts.length === 1) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
			if (pts.length === 2) return `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)} L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`
			const p = pts.map((pt) => ({ x: pt.x, y: pt.y }))
			const path = []
			path.push(`M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`)
			for (let i = 0; i < p.length - 1; i++) {
				const p0 = p[Math.max(i - 1, 0)]
				const p1 = p[i]
				const p2 = p[i + 1]
				const p3 = p[Math.min(i + 2, p.length - 1)]

				const t = tension
				const cp1x = p1.x + (p2.x - p0.x) / 6 * t
				const cp1y = p1.y + (p2.y - p0.y) / 6 * t
				const cp2x = p2.x - (p3.x - p1.x) / 6 * t
				const cp2y = p2.y - (p3.y - p1.y) / 6 * t

				path.push(`C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`)
			}
			return path.join(' ')
		}

		const nearPath = catmullRom2bezier(projected.slice(0, n1 + 1), 0.6)
		const midPath = catmullRom2bezier(projected.slice(n1, n2 + 1), 0.6)
		const farPath = catmullRom2bezier(projected.slice(n2, projected.length), 0.6)

	// depth markers at 25/50/75%
	const markers = []
	if (len > 3) {
		markers.push(projected[Math.floor(len * 0.25)])
		markers.push(projected[Math.floor(len * 0.5)])
		markers.push(projected[Math.floor(len * 0.75)])
	}

	// reference horizon / guide
	const referenceYBase = size.h * 0.5
	const referenceY = referenceYBase + cameraPitchNormalized * size.h * 0.10
	const lineX1 = size.w * 0.10
	const lineX2 = size.w * 0.90


	// Distance ray + markers (metrics)
	const totalDistanceMeters = (flightPoints && flightPoints.length)
		? Math.max(...flightPoints.map((p) => p.distanceMeters || 0))
		: disc
		? estimateFlightDistance(disc)
		: 100

	const markersMeters = []
	const maxMarker = Math.floor(totalDistanceMeters / 10) * 10
	for (let m = 10; m <= maxMarker; m += 10) markersMeters.push(m)

	// helper: project a ground point at given meters using same projection math
	const projectGround = (meters) => {
		// include release (0) and total so projection normalizes consistently
		const pts = [
			{ distanceMeters: 0, lateral: 0, height: 0 },
			{ distanceMeters: totalDistanceMeters, lateral: 0, height: 0 },
			{ distanceMeters: meters, lateral: 0, height: 0 },
			{ distanceMeters: Math.min(totalDistanceMeters, meters + 0.1), lateral: 0, height: 0 },
		]
		const proj = projectFlightPoints(pts, size.w, size.h, cameraPitchNormalized, launchAngle)
		return { point: proj[2], next: proj[3] }
	}

	// landing point for metrics (ensure using ground projection at totalDistanceMeters)
	const landingGround = projectGround(totalDistanceMeters).point

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
			{/* subtle horizon/reference lines */}
			<g>
				<line x1={lineX1} x2={lineX2} y1={referenceY - size.h * 0.012} y2={referenceY - size.h * 0.012} stroke="white" strokeWidth={1} strokeOpacity={0.08} strokeDasharray="4 6" />
				<line x1={lineX1} x2={lineX2} y1={referenceY} y2={referenceY} stroke="white" strokeWidth={1} strokeOpacity={0.12} strokeDasharray="4 6" />
				<line x1={lineX1} x2={lineX2} y1={referenceY + size.h * 0.012} y2={referenceY + size.h * 0.012} stroke="white" strokeWidth={1} strokeOpacity={0.20} strokeDasharray="4 6" />
			</g>
			{/* Distance Ray (ground reference) - rendered under flight line */}
			<g>
				<line x1={start.x} y1={start.y} x2={landingGround.x} y2={landingGround.y} stroke="white" strokeWidth={1} strokeOpacity={0.25} strokeDasharray="3 5" />
				{/* markers */}
				{markersMeters.map((m, i) => {
					const { point, next } = projectGround(m)
					if (!point) return null
					let dx = next.x - point.x
					let dy = next.y - point.y
					let len = Math.hypot(dx, dy)
					if (len < 1e-6) {
						// fallback to global ray direction
						const gdx = landingGround.x - start.x
						const gdy = landingGround.y - start.y
						dx = -gdy
						dy = gdx
						len = Math.hypot(dx, dy) || 1
					}
					const ux = dx / len
					const uy = dy / len
					// perpendicular
					const px = -uy
					const py = ux
					// tick length scales with depth (near larger, far smaller)
					const depthRatio = m / Math.max(1, totalDistanceMeters)
					const tickLen = Math.max(6, 14 * Math.pow(1 - depthRatio, 0.6))
					const x1 = point.x - px * (tickLen / 2)
					const y1 = point.y - py * (tickLen / 2)
					const x2 = point.x + px * (tickLen / 2)
					const y2 = point.y + py * (tickLen / 2)
					const labelX = point.x + px * (tickLen / 2 + 6)
					const labelY = point.y + py * (tickLen / 2 + 4)
					return (
						<g key={`dm-${i}`}>
							<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={1} strokeOpacity={0.4} />
							<text x={labelX} y={labelY} fontSize={10} fill="white" opacity={0.4} textAnchor="middle">
								{m}
							</text>
						</g>
					)
				})}
			</g>

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

			{/* permission button for iOS motion access */}
			{requestPermissionNeeded && (
				<g>
					<foreignObject x={size.w - 160} y={20} width={140} height={44}>
						<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<button onClick={() => requestPermission()} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
								Enable motion
							</button>
						</div>
					</foreignObject>
				</g>
			)}
		</svg>
	)
}
