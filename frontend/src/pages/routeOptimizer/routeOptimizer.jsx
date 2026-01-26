import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, InfoWindowF, MarkerF, PolylineF, useJsApiLoader } from '@react-google-maps/api'

import { mockItinerary } from '../../mockData/itineraryData.js'
import { destinationData } from '../../mockData/destinationData.js'

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
	const [locationError, setLocationError] = useState('')
	const [currentLocation, setCurrentLocation] = useState(null)
	const locationRequestedRef = useRef(false)

	const [selectedMarkerId, setSelectedMarkerId] = useState(null)

	const itinerary = mockItinerary

	const destinationById = useMemo(() => {
		const map = new Map()
		for (const d of destinationData) map.set(d.id, d)
		return map
	}, [])

	const itineraryWithStart = useMemo(() => {
		if (!currentLocation) return itinerary
		const start = {
			id: 'start-user-location',
			name: 'Your location',
			location: currentLocation,
			description: 'Starting point (from browser geolocation)',
		}
		return [start, ...itinerary]
	}, [currentLocation, itinerary])

	const activeItinerary = result?.optimized_itinerary?.length
		? result.optimized_itinerary
		: itineraryWithStart

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

	function getCurrentPositionPromise(options) {
		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(resolve, reject, options)
		})
	}

	async function requestCurrentLocation() {
		setLocationError('')
		if (!('geolocation' in navigator)) {
			setLocationError('Geolocation is not supported in this browser.')
			return
		}

		try {
			// Try fast/high accuracy first
			const pos = await getCurrentPositionPromise({
				enableHighAccuracy: true,
				timeout: 12000,
				maximumAge: 15000,
			})
			setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
			setSelectedMarkerId('start-user-location')
			return
		} catch (err) {
			// Retry with lower accuracy and longer timeout (helps on desktops and slow GPS)
			try {
				const pos = await getCurrentPositionPromise({
					enableHighAccuracy: false,
					timeout: 25000,
					maximumAge: 60000,
				})
				setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
				setSelectedMarkerId('start-user-location')
				return
			} catch (err2) {
				const code = err2?.code
				if (code === 1) {
					setLocationError('Location permission denied. Enable location access in your browser settings and try again.')
				} else if (code === 2) {
					setLocationError('Location unavailable. Check your device location services and try again.')
				} else if (code === 3) {
					setLocationError(
						'Position acquisition timed out. Try again, or enable location services/Wi‑Fi, or use a device with GPS. (Geolocation also requires a secure context: https or localhost.)',
					)
				} else {
					setLocationError(err2?.message || 'Location permission denied or unavailable.')
				}
			}
		}
	}

	useEffect(() => {
		// Avoid double-requesting under React StrictMode.
		if (locationRequestedRef.current) return
		locationRequestedRef.current = true
		requestCurrentLocation()
	}, [])

	async function optimize() {
		setError('')
		setLoading(true)
		try {
			const baseUrl = import.meta.env.VITE_ROUTE_OPTIMIZER_BASE_URL
			const url = baseUrl ? `${baseUrl}/optimize` : '/api/optimize'

			// If we have a current location, force the route to start from it
			// by prepending it at index 0 and turning off try_all_starts.
			const effectiveTryAllStarts = currentLocation ? false : tryAllStarts
			const effectiveItinerary = currentLocation ? itineraryWithStart : itinerary

			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itinerary: effectiveItinerary,
					return_to_start: returnToStart,
					try_all_starts: effectiveTryAllStarts,
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
					<button className="ro-button" onClick={requestCurrentLocation} disabled={loading}>
						Use my location
					</button>
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
							checked={currentLocation ? false : tryAllStarts}
							onChange={(e) => setTryAllStarts(e.target.checked)}
							disabled={Boolean(currentLocation)}
						/>
						Try all starts
					</label>
					<button className="ro-button" onClick={optimize} disabled={loading}>
						{loading ? 'Optimizing…' : 'Optimize route'}
					</button>
				</div>
			</header>

			{error ? <div className="ro-error">{error}</div> : null}
			{locationError ? <div className="ro-error">{locationError}</div> : null}

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
							onClick={() => setSelectedMarkerId(null)}
						>
							{activeItinerary.map((d, idx) => (
								<MarkerF
									key={d.id}
									position={{ lat: d.location.lat, lng: d.location.lng }}
									label={
										d.id === 'start-user-location'
											? { text: 'Start', fontWeight: '800' }
											: { text: String(idx + 1), fontWeight: '700' }
									}
									onClick={() => setSelectedMarkerId(d.id)}
								/>
							))}

							{selectedMarkerId ? (
								selectedMarkerId === 'start-user-location' && currentLocation ? (
									<InfoWindowF position={currentLocation} onCloseClick={() => setSelectedMarkerId(null)}>
										<div style={{ maxWidth: 240, color: '#111827' }}>
											<div style={{ fontWeight: 800, marginBottom: 6 }}>Your location</div>
											<div style={{ fontSize: 12, opacity: 0.85 }}>
												{round2(currentLocation.lat)}, {round2(currentLocation.lng)}
											</div>
										</div>
									</InfoWindowF>
								) : (
									(() => {
										const fromCatalog = destinationById.get(selectedMarkerId)
										const fromActive = activeItinerary.find((x) => x.id === selectedMarkerId)
										const dest = fromCatalog || fromActive
										if (!dest) return null
										return (
											<InfoWindowF
												position={{ lat: dest.location.lat, lng: dest.location.lng }}
												onCloseClick={() => setSelectedMarkerId(null)}
											>
												<div style={{ maxWidth: 280, color: '#111827' }}>
													<div style={{ fontWeight: 800, marginBottom: 6 }}>{dest.name}</div>
													{dest.description ? (
														<div style={{ fontSize: 13, marginBottom: 6 }}>{dest.description}</div>
													) : null}
													<div style={{ fontSize: 12, opacity: 0.8 }}>
														{round2(dest.location.lat)}, {round2(dest.location.lng)}
													</div>
												</div>
											</InfoWindowF>
										)
									})()
								)
							) : null}

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
