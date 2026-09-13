export default function DiscSelector({ discs, selectedDiscId, onSelect }) {
	return (
		<div className="disc-selector">
			<div className="disc-scroll">
				{discs.map((d) => {
					const active = d.id === selectedDiscId
					return (
						<button
							key={d.id}
							className={`disc-btn ${active ? 'active' : ''}`}
							onClick={() => onSelect(d.id)}
							aria-pressed={active}
						>
							<div className="disc-name">{d.name}</div>
							<div className="disc-cat">{d.category}</div>
						</button>
					)
				})}
			</div>
		</div>
	)
}
