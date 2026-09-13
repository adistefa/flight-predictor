export default function DiscInfo({ disc }) {
	if (!disc) return null

	return (
		<div className="disc-info">
			<div className="disc-info-name">{disc.name}</div>
			<div className="disc-info-stats">{`${disc.speed} · ${disc.glide} · ${disc.turn} · ${disc.fade}`}</div>
		</div>
	)
}
