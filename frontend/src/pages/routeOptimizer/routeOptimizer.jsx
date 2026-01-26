import { useMemo, useState } from 'react'
import { GoogleMap, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api'

import { mockItinerary } from '../../mockData/itineraryData.js'

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 }

function round2(n) {
	return Math.round(n * 100) / 100
}

function computeCenter(points) {
	if (!points.length) return SRI_LANKA_CENTER
	const sum = points.reduce(
		(acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
		{ lat: 0, lng: 0 },
	)
	return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

export default function RouteOptimizer() {
	const [returnToStart, setReturnToStart] = useState(false)
	const [tryAllStarts, setTryAllStarts] = useState(true)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [result, setResult] = useState(null)

	const itinerary = mockItinerary

	const activeItinerary = result?.optimized_itinerary?.length ? result.optimized_itinerary : itinerary

	const pathPoints = useMemo(() => {
		const pts = activeItinerary.map((d) => ({ lat: d.location.lat, lng: d.location.lng }))
		if (returnToStart && pts.length > 1) pts.push(pts[0])
		return pts
	}, [activeItinerary, returnToStart])

	const center = useMemo(() => computeCenter(pathPoints), [pathPoints])

	const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
	const { isLoaded } = useJsApiLoader({
		id: 'ceylonroam-google-maps',
		googleMapsApiKey: googleMapsApiKey || '',
	})

	async function optimize() {
		setError('')
		setLoading(true)
		try {
			const baseUrl = import.meta.env.VITE_ROUTE_OPTIMIZER_BASE_URL
			const url = baseUrl ? `${baseUrl}/optimize` : '/api/optimize'

			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itinerary,
					return_to_start: returnToStart,
					try_all_starts: tryAllStarts,
				}),
			})

			if (!res.ok) {
				const text = await res.text()
				throw new Error(text || `Request failed (${res.status})`)
			}

			const json = await res.json()
			setResult(json)
		} catch (e) {
			setResult(null)
			setError(e?.message || 'Failed to optimize route')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="ro-page">
			<header className="ro-header">
				<div>
					<h1 className="ro-title">Route Optimizer</h1>
					<p className="ro-subtitle">Haversine distance + greedy nearest-neighbor + 2-opt</p>
				</div>
				<div className="ro-actions">
					<label className="ro-toggle">
						<input
							type="checkbox"
							checked={returnToStart}
							onChange={(e) => setReturnToStart(e.target.checked)}
						/>
						Return to start
					</label>
					<label className="ro-toggle">
						<input
							type="checkbox"
							checked={tryAllStarts}
							onChange={(e) => setTryAllStarts(e.target.checked)}
						/>
						Try all starts
					</label>
					<button className="ro-button" onClick={optimize} disabled={loading}>
						{loading ? 'Optimizing…' : 'Optimize route'}
					</button>
				</div>
			</header>

			{error ? <div className="ro-error">{error}</div> : null}

			<main className="ro-grid">
				<section className="ro-card ro-left">
					<h2 className="ro-h2">Itinerary</h2>
					<ol className="ro-list">
						{activeItinerary.map((d) => (
							<li key={d.id} className="ro-item">
								<div className="ro-item-title">{d.name}</div>
								<div className="ro-item-meta">
									{round2(d.location.lat)}, {round2(d.location.lng)}
								</div>
								{d.description ? <div className="ro-item-desc">{d.description}</div> : null}
							</li>
						))}
					</ol>

					<div className="ro-summary">
						<div>
							<span className="ro-summary-label">Total distance:</span>{' '}
							<span className="ro-summary-value">
								{result?.total_distance_km != null ? `${round2(result.total_distance_km)} km` : '—'}
							</span>
						</div>
						<div className="ro-summary-hint">
							Start the backend and add your Google key to enable the map.
						</div>
					</div>
				</section>

				<section className="ro-card ro-map">
					{!googleMapsApiKey ? (
						<div className="ro-map-placeholder">
							Missing <code>VITE_GOOGLE_MAPS_API_KEY</code>. Add it in <code>frontend/.env</code> (see
							<code>frontend/.env.example</code>).
						</div>
					) : !isLoaded ? (
						<div className="ro-map-placeholder">Loading Google Maps…</div>
					) : (
						<GoogleMap
							mapContainerStyle={{ width: '100%', height: '100%' }}
							center={center}
							zoom={7}
							options={{
								mapTypeControl: false,
								streetViewControl: false,
								fullscreenControl: true,
							}}
						>
							{activeItinerary.map((d, idx) => (
								<MarkerF
									key={d.id}
									position={{ lat: d.location.lat, lng: d.location.lng }}
									label={{ text: String(idx + 1), fontWeight: '700' }}
								/>
							))}
							{pathPoints.length > 1 ? (
								<PolylineF
									path={pathPoints}
									options={{
										strokeColor: '#2563eb',
										strokeOpacity: 0.9,
										strokeWeight: 4,
									}}
								/>
							) : null}
						</GoogleMap>
					)}
				</section>
			</main>
		</div>
	)
}
