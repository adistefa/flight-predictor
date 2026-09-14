export default function LaunchAngleControl({ value, onChange }) {
	const display = value > 0 ? `+${value}°` : `${value}°`

	return (
		<div className="launch-control">
			<div className="launch-labels">
				<div>30°</div>
				<div>20°</div>
				<div>10°</div>
				<div>0°</div>
				<div>-10°</div>
				<div>-15°</div>
			</div>

			<div className="launch-slider-wrap">
				<input
					type="range"
					min={-15}
					max={30}
					step={1}
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					className="launch-range"
				/>
			</div>

			<div className="launch-value">{display}</div>
		</div>
	)
}
