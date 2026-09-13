export default function ReleaseAngleControl({ value, onChange }) {
	return (
		<div className="release-control">
			<div className="release-labels">
				<div className="left">HYZER</div>
				<div className="center">FLAT</div>
				<div className="right">ANHYZER</div>
			</div>
			<input
				type="range"
				min={-30}
				max={30}
				step={1}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				className="release-range"
			/>
			<div className="release-value">{value}°</div>
		</div>
	)
}
