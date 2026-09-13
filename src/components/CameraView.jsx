import { useEffect, useRef, useState } from 'react'

export default function CameraView() {
	const videoRef = useRef(null)
	const streamRef = useRef(null)
	const [available, setAvailable] = useState(true)

	useEffect(() => {
		let mounted = true

		async function start() {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: { ideal: 'environment' } },
					audio: false
				})
				if (!mounted) return
				streamRef.current = stream
				if (videoRef.current) {
					videoRef.current.srcObject = stream
					videoRef.current.play().catch(() => {})
				}
				setAvailable(true)
			} catch (err) {
				console.warn('Camera unavailable', err)
				setAvailable(false)
			}
		}

		start()

		return () => {
			mounted = false
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((t) => t.stop())
				streamRef.current = null
			}
		}
	}, [])

	return (
		<div className="camera-root">
			{available ? (
				<video
					ref={videoRef}
					className="camera-video"
					playsInline
					muted
					autoPlay
				/>
			) : (
				<div className="camera-unavailable">
					<div className="camera-msg">Camera unavailable</div>
				</div>
			)}
		</div>
	)
}
