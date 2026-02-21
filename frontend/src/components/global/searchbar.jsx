import React, { useState, useEffect } from 'react';
import destinationsData from '../../dataset/destinations.json';

const SearchBar = () => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);

	useEffect(() => {
		if (!query) {
			setResults([]);
			return;
		}
		const filtered = destinationsData.filter(dest => {
			const searchString = `${dest.name} ${dest.category} ${dest.description}`.toLowerCase();
			return searchString.includes(query.toLowerCase());
		});
		setResults(filtered);
	}, [query]);

	return (
		<div style={{ maxWidth: 600, margin: '0 auto' }}>
			<input
				type="text"
				placeholder="Search destinations..."
				value={query}
				onChange={e => setQuery(e.target.value)}
				style={{ width: '100%', padding: '8px', fontSize: '16px', marginBottom: '16px' }}
			/>
			{results.length > 0 && (
				<ul style={{ listStyle: 'none', padding: 0 }}>
					{results.map(dest => (
						<li key={dest.id} style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
							<strong>{dest.name}</strong> <span style={{ color: '#888' }}>({dest.category})</span>
							<div style={{ fontSize: '14px', color: '#555' }}>{dest.description}</div>
						</li>
					))}
				</ul>
			)}
			{query && results.length === 0 && (
				<div style={{ color: '#888' }}>No destinations found.</div>
			)}
		</div>
	);
};

export default SearchBar;
