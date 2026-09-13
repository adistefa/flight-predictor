export default function DiscSelector({ discs, selectedDiscId, onSelect }) {
	return (
		<div className="disc-selector">
			<div className="disc-scroll">
				{discs.map((d) => {
					const active = d.id === selectedDiscId
					return (
						<button
							key={d.id}
							className={`disc-pill ${active ? 'active' : ''}`}
							onClick={() => onSelect(d.id)}
							aria-pressed={active}
						>
							{d.name}
						</button>
					)
				})}
			</div>
		</div>
	)
}
