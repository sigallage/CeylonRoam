import { useEffect, useMemo, useRef, useState } from 'react'
import {
	CircleF,
	DirectionsRenderer,
	GoogleMap,
	InfoWindowF,
	MarkerF,
	PolylineF,
	TrafficLayer,
	useJsApiLoader,
} from '@react-google-maps/api'

import { mockItinerary } from '../../mockData/itineraryData.js'
import { destinationData } from '../../mockData/destinationData.js'

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 }

function round2(n) {
	return Math.round(n * 100) / 100
}

function formatMinutesToHhMm(totalMinutes) {
	if (totalMinutes == null || Number.isNaN(totalMinutes)) return '—'
	const minutes = Math.round(totalMinutes)
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	if (h <= 0) return `${m} min`
	return `${h} h ${m} min`
}

function computeCenter(points) {
	if (!points.length) return SRI_LANKA_CENTER
	const sum = points.reduce(
		(acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
		{ lat: 0, lng: 0 },
	)
	return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

function stripHtml(html) {
	if (!html) return ''
	try {
		const el = document.createElement('div')
		el.innerHTML = html
		return (el.textContent || el.innerText || '').trim()
	} catch {
		return String(html).replace(/<[^>]*>/g, '').trim()
	}
}

function formatDistance(meters) {
	if (meters == null || Number.isNaN(meters)) return '—'
	if (meters < 1000) return `${Math.round(meters)} m`
	const km = meters / 1000
	return `${km >= 10 ? Math.round(km) : Math.round(km * 10) / 10} km`
}

function formatTimeOfDay(date) {
	try {
		return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date)
	} catch {
		return date.toLocaleTimeString()
	}
}

function trafficColorForLeg(leg) {
	// Approximate traffic level using ratio of duration_in_traffic to duration.
	// Note: Directions API does not provide true per-segment congestion colors like the native Google Maps app.
	const base = leg?.duration?.value
	const traffic = leg?.duration_in_traffic?.value
	if (!base || !traffic) return '#1e3a8a' // dark blue fallback
	const ratio = traffic / base
	if (ratio <= 1.12) return '#1e3a8a' // dark blue (free flow)
	if (ratio <= 1.35) return '#f59e0b' // yellow (light traffic)
	return '#ef4444' // red (heavy traffic)
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
	const locationWatchIdRef = useRef(null)
	const mapRef = useRef(null)

	const [selectedMarkerId, setSelectedMarkerId] = useState(null)

	const [optMode, setOptMode] = useState('distance')
	const [showTrafficLayer, setShowTrafficLayer] = useState(true)
	const [directions, setDirections] = useState(null)
	const [directionsError, setDirectionsError] = useState('')
	const [directionsTotals, setDirectionsTotals] = useState({ durationS: null, trafficS: null })

	const [navActive, setNavActive] = useState(false)
	const [travelMode, setTravelMode] = useState('DRIVING')
	const [vehicleType, setVehicleType] = useState('car')
	const [followUser, setFollowUser] = useState(true)
	const [navTick, setNavTick] = useState(0)
	const [userHeading, setUserHeading] = useState(null)
	const [userAccuracyM, setUserAccuracyM] = useState(null)
	const [navStepFlatIndex, setNavStepFlatIndex] = useState(0)
	const [navSteps, setNavSteps] = useState([])

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

	const trafficEnabled = optMode !== 'distance'

	useEffect(() => {
		// Build a real route to display (preserving our optimized order).
		if (!isLoaded) return
		if (!googleMapsApiKey) return
		if (!activeItinerary || activeItinerary.length < 1) return
		if (!window.google?.maps?.DirectionsService) return

		setDirectionsError('')

		const stops = activeItinerary.filter((d) => d.id !== 'start-user-location')
		const effectiveOrigin = navActive && currentLocation
			? currentLocation
			: activeItinerary[0]
				? { lat: activeItinerary[0].location.lat, lng: activeItinerary[0].location.lng }
				: null

		if (!effectiveOrigin) return
		if (stops.length < 1) {
			setDirections(null)
			setDirectionsTotals({ durationS: null, trafficS: null })
			return
		}

		const effectiveTravelMode =
			(window.google.maps.TravelMode && window.google.maps.TravelMode[travelMode]) ||
			window.google.maps.TravelMode.DRIVING

		const destination = returnToStart
			? effectiveOrigin
			: {
				lat: stops[stops.length - 1].location.lat,
				lng: stops[stops.length - 1].location.lng,
			}

		const waypoints = stops.slice(0, returnToStart ? undefined : -1).map((d) => ({
			location: { lat: d.location.lat, lng: d.location.lng },
			stopover: true,
		}))

		const service = new window.google.maps.DirectionsService()
		const isDriving = effectiveTravelMode === window.google.maps.TravelMode.DRIVING
		if (effectiveTravelMode === window.google.maps.TravelMode.TRANSIT && waypoints.length) {
			setDirections(null)
			setDirectionsTotals({ durationS: null, trafficS: null })
			setDirectionsError('Transit mode does not support multi-stop routes. Switch to Driving/Walking for itinerary routing.')
			return
		}
		const request = {
			origin: effectiveOrigin,
			destination,
			waypoints,
			optimizeWaypoints: false,
			travelMode: effectiveTravelMode,
		}
		if (isDriving) {
			request.drivingOptions = {
				departureTime: new Date(),
				trafficModel: window.google.maps.TrafficModel?.BEST_GUESS,
			}
		}
		service.route(
			request,
			(res, status) => {
				if (status === 'OK' && res) {
					setDirections(res)
					try {
						const legs = res.routes?.[0]?.legs || []
						let durationS = 0
						let trafficS = 0
						let hasTraffic = false
						for (const leg of legs) {
							durationS += leg?.duration?.value || 0
							if (leg?.duration_in_traffic?.value != null) {
								trafficS += leg.duration_in_traffic.value
								hasTraffic = true
							}
						}
						setDirectionsTotals({ durationS, trafficS: hasTraffic ? trafficS : null })

						// Flatten step list for simple navigation HUD.
						const flat = []
						for (let li = 0; li < legs.length; li++) {
							const steps = legs[li]?.steps || []
							for (let si = 0; si < steps.length; si++) {
								const s = steps[si]
								flat.push({
									legIndex: li,
									stepIndex: si,
									instructionHtml: s?.instructions || '',
									instructionText: stripHtml(s?.instructions || ''),
									maneuver: s?.maneuver || null,
									distanceM: s?.distance?.value ?? null,
									durationS: s?.duration?.value ?? null,
									end: s?.end_location
										? { lat: s.end_location.lat(), lng: s.end_location.lng() }
										: null,
								})
							}
						}
						setNavSteps(flat)
						setNavStepFlatIndex(0)
					} catch {
						setDirectionsTotals({ durationS: null, trafficS: null })
						setNavSteps([])
						setNavStepFlatIndex(0)
					}
				} else {
					setDirections(null)
					setDirectionsTotals({ durationS: null, trafficS: null })
					setDirectionsError(`Directions unavailable: ${status}`)
					setNavSteps([])
					setNavStepFlatIndex(0)
				}
			},
		)
	}, [activeItinerary, isLoaded, googleMapsApiKey, returnToStart, travelMode, navActive, currentLocation, navTick])

	useEffect(() => {
		if (!navActive) return
		const t = window.setInterval(() => setNavTick((x) => x + 1), 30000)
		return () => window.clearInterval(t)
	}, [navActive])

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

	useEffect(() => {
		// While navigating, keep the camera following the user (like Google Maps).
		if (!navActive) return
		if (!followUser) return
		if (!currentLocation) return
		const map = mapRef.current
		if (!map) return
		map.panTo(currentLocation)
		if (map.getZoom() < 12) map.setZoom(13)
	}, [navActive, followUser, currentLocation])

	function startNavigation() {
		setError('')
		setDirectionsError('')
		if (!googleMapsApiKey) {
			setError('Missing VITE_GOOGLE_MAPS_API_KEY. Add it in frontend/.env (see frontend/.env.example).')
			return
		}
		setShowTrafficLayer(true)
		setNavActive(true)
		requestCurrentLocation()
		if ('geolocation' in navigator && locationWatchIdRef.current == null) {
			locationWatchIdRef.current = navigator.geolocation.watchPosition(
				(pos) => {
					setUserHeading(pos.coords.heading ?? null)
					setUserAccuracyM(pos.coords.accuracy ?? null)
					setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
					setSelectedMarkerId('start-user-location')
				},
				(err) => {
					// Non-fatal: user can still see traffic + route without live location updates.
					setLocationError(err?.message || 'Unable to track location while navigating.')
				},
				{ enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
			)
		}
	}

	function stopNavigation() {
		setNavActive(false)
		setFollowUser(true)
		if (locationWatchIdRef.current != null) {
			navigator.geolocation.clearWatch(locationWatchIdRef.current)
			locationWatchIdRef.current = null
		}
	}

	useEffect(() => {
		// Advance to the next step once we get close to the current step end.
		if (!navActive) return
		if (!currentLocation) return
		if (!navSteps.length) return
		const cur = navSteps[navStepFlatIndex]
		if (!cur?.end) return
		const dx = (cur.end.lat - currentLocation.lat) * 111320
		const dy = (cur.end.lng - currentLocation.lng) * 111320 * Math.cos((currentLocation.lat * Math.PI) / 180)
		const distM = Math.sqrt(dx * dx + dy * dy)
		if (distM < 35 && navStepFlatIndex < navSteps.length - 1) setNavStepFlatIndex((i) => i + 1)
	}, [navActive, currentLocation, navSteps, navStepFlatIndex])

	function recenter() {
		if (!currentLocation) return
		const map = mapRef.current
		if (map) {
			map.panTo(currentLocation)
			if (map.getZoom() < 15) map.setZoom(16)
		}
		setFollowUser(true)
	}

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

			const metric = trafficEnabled ? 'google' : 'haversine'
			const optimizeFor = trafficEnabled ? (optMode === 'time' ? 'time' : 'hybrid') : 'distance'

			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itinerary: effectiveItinerary,
					return_to_start: returnToStart,
					try_all_starts: effectiveTryAllStarts,
					metric,
					optimize_for: optimizeFor,
					distance_weight: 1,
					time_weight: optMode === 'time' ? 2 : 1,
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
					<button
						className={navActive ? 'ro-button ro-button-danger' : 'ro-button ro-button-primary'}
						onClick={navActive ? stopNavigation : startNavigation}
						disabled={loading}
						title="Start a live driving view with traffic"
					>
						{navActive ? 'Stop' : 'Start'}
					</button>

					<label className="ro-toggle" title="Travel mode used for the on-map route">
						Mode
						<select
							value={travelMode}
							onChange={(e) => setTravelMode(e.target.value)}
							style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8 }}
							disabled={!googleMapsApiKey}
						>
							<option value="DRIVING">Driving</option>
							<option value="WALKING">Walking</option>
							<option value="BICYCLING">Bicycling</option>
							<option value="TRANSIT">Transit</option>
						</select>
					</label>

					{travelMode === 'DRIVING' ? (
						<label className="ro-toggle" title="Vehicle type (UI only; Google Maps JS API uses DRIVING)">
							Vehicle
							<select
								value={vehicleType}
								onChange={(e) => setVehicleType(e.target.value)}
								style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8 }}
								disabled={!googleMapsApiKey}
							>
								<option value="car">Car</option>
								<option value="motorcycle">Motorcycle</option>
							</select>
						</label>
					) : null}

					<label className="ro-toggle" title="Keep the camera centered on your live location while navigating">
						<input
							type="checkbox"
							checked={followUser}
							onChange={(e) => setFollowUser(e.target.checked)}
							disabled={!navActive}
						/>
						Follow me
					</label>

					<button className="ro-button" onClick={requestCurrentLocation} disabled={loading}>
						Use my location
					</button>

					<label className="ro-toggle">
						Optimize for
						<select
							value={optMode}
							onChange={(e) => setOptMode(e.target.value)}
							style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8 }}
						>
							<option value="distance">Distance (Haversine)</option>
							<option value="time">Time (Live traffic)</option>
							<option value="hybrid">Hybrid (Traffic + distance)</option>
						</select>
					</label>

					<label className="ro-toggle">
						<input
							type="checkbox"
							checked={showTrafficLayer || navActive}
							onChange={(e) => setShowTrafficLayer(e.target.checked)}
							disabled={!googleMapsApiKey}
						/>
						Show traffic
					</label>
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
			{directionsError ? <div className="ro-error">{directionsError}</div> : null}

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
						<div>
							<span className="ro-summary-label">Total time:</span>{' '}
							<span className="ro-summary-value">
								{formatMinutesToHhMm(
									(result?.total_duration_seconds != null
										? result.total_duration_seconds / 60
										: directionsTotals.durationS != null
											? directionsTotals.durationS / 60
											: null),
								)}
							</span>
						</div>
						<div>
							<span className="ro-summary-label">Total time (traffic):</span>{' '}
							<span className="ro-summary-value">
								{formatMinutesToHhMm(
									(result?.total_duration_in_traffic_seconds != null
										? result.total_duration_in_traffic_seconds / 60
										: directionsTotals.trafficS != null
											? directionsTotals.trafficS / 60
											: null),
								)}
							</span>
						</div>
						<div className="ro-summary-hint">
							For live traffic optimization, set backend <code>GOOGLE_MAPS_API_KEY</code> (Distance Matrix API).
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
						<div className="ro-map-wrap">
							<GoogleMap
								mapContainerStyle={{ width: '100%', height: '100%' }}
								center={center}
								zoom={7}
								options={{
									mapTypeControl: false,
									streetViewControl: false,
									fullscreenControl: true,
								}}
								onLoad={(map) => {
									mapRef.current = map
								}}
								onClick={() => {
									setSelectedMarkerId(null)
									setFollowUser(false)
								}}
							>
								{showTrafficLayer || navActive ? <TrafficLayer /> : null}

								{userAccuracyM && currentLocation ? (
									<CircleF
										center={currentLocation}
										radius={Math.min(userAccuracyM, 120)}
										options={{
											fillColor: '#3b82f6',
											fillOpacity: 0.12,
											strokeColor: '#3b82f6',
											strokeOpacity: 0.25,
											strokeWeight: 2,
										}} 
									/>
								) : null}

								{activeItinerary.map((d, idx) => {
									const isUser = d.id === 'start-user-location'
									const icon =
										isLoaded && isUser && navActive && window.google?.maps
											? {
												path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
												scale: 6,
												rotation: userHeading ?? 0,
												fillColor: '#2563eb',
												fillOpacity: 1,
												strokeColor: '#ffffff',
												strokeWeight: 2,
											}
											: undefined
									return (
										<MarkerF
											key={d.id}
											position={{ lat: d.location.lat, lng: d.location.lng }}
											icon={icon}
											label={
												isUser
													? navActive
														? null
														: { text: 'Start', fontWeight: '800' }
													: {
														text: String(activeItinerary[0]?.id === 'start-user-location' ? idx : idx + 1),
														fontWeight: '700',
													}
											}
											onClick={() => setSelectedMarkerId(d.id)}
										/>
									)
								})}

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
								directions ? (
									(() => {
										const route = directions?.routes?.[0]
										const legs = route?.legs || []
										const isDriving =
											travelMode === 'DRIVING' && window.google?.maps?.TravelMode?.DRIVING
										// Draw the route ourselves so we can color by traffic.
										return (
											<>
												{legs.length
													? legs.map((leg, legIndex) => {
														const strokeColor = isDriving ? trafficColorForLeg(leg) : '#1e3a8a'
														const steps = leg?.steps || []
														return steps.map((step, stepIndex) => {
															const path = (step?.path || []).map((p) => ({
																lat: p.lat(),
																lng: p.lng(),
															}))
															return (
																<PolylineF
																	key={`leg-${legIndex}-step-${stepIndex}`}
																	path={path}
																	options={{
																		strokeColor,
																		strokeOpacity: 0.95,
																		strokeWeight: 6,
																		zIndex: 5,
																	}}
																/>
															)
														})
													})
													: null}

											{/* subtle outline underlay to mimic Google Maps route styling */}
											{route?.overview_path?.length ? (
												<PolylineF
													path={route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }))}
													options={{
														strokeColor: 'rgba(17, 24, 39, 0.55)',
														strokeOpacity: 0.8,
														strokeWeight: 10,
														zIndex: 4,
													}}
												/>
											) : null}
										</>
										)
									})()
								) : (
									<PolylineF
										path={pathPoints}
										options={{
											strokeColor: '#1e3a8a',
											strokeOpacity: 0.9,
											strokeWeight: 4,
										}}
									/>
								)
							) : null}
						</GoogleMap>

							{navActive ? (
								<div className="ro-nav-top" role="status" aria-live="polite">
									<div className="ro-nav-top-row">
										<div className="ro-nav-icon">↑</div>
										<div className="ro-nav-text">
											<div className="ro-nav-primary">
												{navSteps[navStepFlatIndex]?.instructionText || 'Starting navigation…'}
											</div>
											<div className="ro-nav-secondary">
												Then {navSteps[navStepFlatIndex + 1]?.instructionText || 'continue'}
											</div>
										</div>
									</div>
								</div>
							) : null}

							{navActive ? (
								<div className="ro-nav-bottom">
									<button className="ro-nav-pill" onClick={recenter} disabled={!currentLocation}>
										Re-centre
									</button>
									<div className="ro-nav-eta">
										<div className="ro-nav-eta-time">
											{formatMinutesToHhMm(
												(directionsTotals.trafficS ?? directionsTotals.durationS) != null
													? (directionsTotals.trafficS ?? directionsTotals.durationS) / 60
													: null,
											)}
										</div>
										<div className="ro-nav-eta-sub">
											{directions?.routes?.[0]?.legs
												? formatDistance(
													(directions.routes[0].legs || []).reduce(
														(acc, l) => acc + (l?.distance?.value || 0),
														0,
													),
												)
												: '—'}
											{' · '}
											ETA{' '}
											{(() => {
												const s = directionsTotals.trafficS ?? directionsTotals.durationS
												if (!s) return '—'
												return formatTimeOfDay(new Date(Date.now() + s * 1000))
											})()}
										</div>
									</div>
									<div className="ro-nav-pill ro-nav-vehicle" title={`Vehicle: ${vehicleType}`}> 
										{vehicleType === 'motorcycle' ? '🏍' : '🚗'}
									</div>
								</div>
							) : null}
						</div>
					)}
				</section>
			</main>
		</div>
	)
}
