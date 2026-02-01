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

function decodePolyline(encoded) {
	// Google encoded polyline algorithm (no deps)
	if (!encoded) return []
	let index = 0
	let lat = 0
	let lng = 0
	const points = []
	while (index < encoded.length) {
		let b
		let shift = 0
		let result = 0
		do {
			b = encoded.charCodeAt(index++) - 63
			result |= (b & 0x1f) << shift
			shift += 5
		} while (b >= 0x20)
		const dlat = result & 1 ? ~(result >> 1) : result >> 1
		lat += dlat

		shift = 0
		result = 0
		do {
			b = encoded.charCodeAt(index++) - 63
			result |= (b & 0x1f) << shift
			shift += 5
		} while (b >= 0x20)
		const dlng = result & 1 ? ~(result >> 1) : result >> 1
		lng += dlng

		points.push({ lat: lat / 1e5, lng: lng / 1e5 })
	}
	return points
}

function approxDistanceMeters(a, b) {
	if (!a || !b) return Number.POSITIVE_INFINITY
	const dLat = (b.lat - a.lat) * 111320
	const dLng = (b.lng - a.lng) * 111320 * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
	return Math.sqrt(dLat * dLat + dLng * dLng)
}

function toStableStop(candidate, fallback) {
	if (!candidate) return fallback
	return {
		id: candidate.id,
		name: candidate.name,
		location: candidate.location,
		description: candidate.description || '',
	}
}

function trafficColorForSpeed(speed) {
	if (speed === 'NORMAL') return '#1e3a8a'
	if (speed === 'SLOW') return '#f59e0b'
	if (speed === 'TRAFFIC_JAM') return '#ef4444'
	return '#1e3a8a'
}

export default function RouteOptimizer() {
	const ITIN_SOURCE_STORAGE_KEY = 'ceylonroam:routeOptimizer:itinerarySource:v1'
	const MANUAL_ITIN_STORAGE_KEY = 'ceylonroam:routeOptimizer:manualItinerary:v1'
	const GENERATED_ITIN_STORAGE_KEY = 'ceylonroam:itineraryGenerator:itinerary:v1'

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
	const [trafficRoute, setTrafficRoute] = useState(null)
	const [trafficRouteError, setTrafficRouteError] = useState('')

	const [itinerarySource, setItinerarySource] = useState('manual')

	// Start in catalog view (no selected destinations) on every page load.
	const [manualItinerary, setManualItinerary] = useState([])
	const [savedManualItinerary, setSavedManualItinerary] = useState([])
	const [generatedItinerary, setGeneratedItinerary] = useState([])
	const [generatorLoadError, setGeneratorLoadError] = useState('')

	const catalogDestinations = destinationData

	function normalizeItineraryItems(items) {
		if (!Array.isArray(items)) return []
		return items
			.filter((d) => d && typeof d === 'object')
			.map((d, idx) => {
				const location = d.location || {}
				const lat = Number(location.lat)
				const lng = Number(location.lng)
				if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
				return {
					id: typeof d.id === 'string' && d.id ? d.id : `gen-${idx}-${Math.random().toString(16).slice(2)}`,
					name: typeof d.name === 'string' && d.name ? d.name : `Stop ${idx + 1}`,
					location: { lat, lng },
					description: typeof d.description === 'string' ? d.description : '',
				}
			})
			.filter(Boolean)
	}

	function normalizeOptimizedItinerary(items) {
		if (!Array.isArray(items)) return []
		return items
			.filter((d) => d && typeof d === 'object')
			.map((d, idx) => {
				const location = d.location || {}
				const lat = Number(location.lat)
				const lng = Number(location.lng)
				if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
				const baseId = typeof d.id === 'string' && d.id ? d.id : `opt-${Math.round(lat * 1e6) / 1e6}-${Math.round(lng * 1e6) / 1e6}`
				return {
					id: baseId,
					name: typeof d.name === 'string' && d.name ? d.name : `Stop ${idx + 1}`,
					location: { lat, lng },
					description: typeof d.description === 'string' ? d.description : '',
				}
			})
			.filter(Boolean)
	}

	function loadGeneratedItineraryFromStorage() {
		setGeneratorLoadError('')
		try {
			const raw = window.localStorage.getItem(GENERATED_ITIN_STORAGE_KEY)
			if (!raw) {
				setGeneratedItinerary([])
				setGeneratorLoadError(
					'No generated itinerary found. Generate one in the Itinerary Generator feature, or switch to Manual.'
				)
				return
			}
			const parsed = JSON.parse(raw)
			const normalized = normalizeItineraryItems(parsed)
			if (!normalized.length) {
				setGeneratedItinerary([])
				setGeneratorLoadError('Generated itinerary is empty or invalid.')
				return
			}
			setGeneratedItinerary(normalized)
		} catch {
			setGeneratedItinerary([])
			setGeneratorLoadError('Unable to read generated itinerary from storage.')
		}
	}

	useEffect(() => {
		// Read any previously saved manual itinerary, but do not auto-load it.
		try {
			const raw = window.localStorage.getItem(MANUAL_ITIN_STORAGE_KEY)
			if (!raw) return
			const parsed = JSON.parse(raw)
			const normalized = normalizeItineraryItems(parsed)
			if (normalized.length) setSavedManualItinerary(normalized)
		} catch {
			// ignore
		}
	}, [])

	useEffect(() => {
		try {
			window.localStorage.setItem(ITIN_SOURCE_STORAGE_KEY, itinerarySource)
		} catch {
			// ignore
		}
		// Changing source invalidates any existing optimization result.
		setResult(null)
	}, [itinerarySource])

	useEffect(() => {
		try {
			window.localStorage.setItem(MANUAL_ITIN_STORAGE_KEY, JSON.stringify(manualItinerary))
			setSavedManualItinerary(normalizeItineraryItems(manualItinerary))
		} catch {
			// ignore
		}
	}, [manualItinerary])

	useEffect(() => {
		if (itinerarySource !== 'generator') return
		loadGeneratedItineraryFromStorage()
	}, [itinerarySource])

	const selectedItinerary = useMemo(() => {
		if (itinerarySource === 'manual') return normalizeItineraryItems(manualItinerary)
		if (itinerarySource === 'generator') return generatedItinerary
		return mockItinerary
	}, [itinerarySource, manualItinerary, generatedItinerary])
	const VISITED_STORAGE_KEY = 'ceylonroam:routeOptimizer:visitedIds:v1'
	const [visitedIds, setVisitedIds] = useState(() => {
		try {
			const raw = window.localStorage.getItem(VISITED_STORAGE_KEY)
			if (!raw) return []
			const parsed = JSON.parse(raw)
			if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string')
			return []
		} catch {
			return []
		}
	})
	const visitedIdSet = useMemo(() => new Set(visitedIds), [visitedIds])

	useEffect(() => {
		try {
			window.localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(visitedIds))
		} catch {
			// ignore
		}
	}, [visitedIds])

	function setVisited(id, nextVisited) {
		setVisitedIds((prev) => {
			const set = new Set(prev)
			if (nextVisited) set.add(id)
			else set.delete(id)
			return Array.from(set)
		})
		// Any existing optimization result is now stale.
		setResult(null)
	}

	function clearVisited() {
		setVisitedIds([])
		setResult(null)
	}

	const destinationById = useMemo(() => {
		const map = new Map()
		for (const d of destinationData) map.set(d.id, d)
		return map
	}, [])

	const [customName, setCustomName] = useState('')
	const [customLat, setCustomLat] = useState('')
	const [customLng, setCustomLng] = useState('')
	const [customDesc, setCustomDesc] = useState('')

	function addManualFromCatalog(id) {
		const d = destinationById.get(id)
		if (!d) return
		setManualItinerary((prev) => {
			const normalizedPrev = normalizeItineraryItems(prev)
			if (normalizedPrev.some((x) => x.id === d.id)) return prev
			return [...normalizedPrev, d]
		})
		setResult(null)
	}

	function addManualCustom() {
		const lat = Number(customLat)
		const lng = Number(customLng)
		if (!customName.trim()) {
			setError('Enter a name for the custom destination.')
			return
		}
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			setError('Enter valid latitude/longitude for the custom destination.')
			return
		}
		const id = `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`
		setManualItinerary((prev) => {
			const normalizedPrev = normalizeItineraryItems(prev)
			return [
				...normalizedPrev,
				{
					id,
					name: customName.trim(),
					location: { lat, lng },
					description: customDesc.trim(),
				},
			]
		})
		setCustomName('')
		setCustomLat('')
		setCustomLng('')
		setCustomDesc('')
		setResult(null)
	}

	function removeManual(id) {
		setManualItinerary((prev) => normalizeItineraryItems(prev).filter((d) => d.id !== id))
		setResult(null)
	}

	function moveManual(id, direction) {
		setManualItinerary((prev) => {
			const list = normalizeItineraryItems(prev)
			const idx = list.findIndex((d) => d.id === id)
			if (idx < 0) return prev
			const nextIdx = direction === 'up' ? idx - 1 : idx + 1
			if (nextIdx < 0 || nextIdx >= list.length) return prev
			const copy = list.slice()
			const [item] = copy.splice(idx, 1)
			copy.splice(nextIdx, 0, item)
			return copy
		})
		setResult(null)
	}

	const startPlace = useMemo(() => {
		if (!currentLocation) return null
		return {
			id: 'start-user-location',
			name: 'Your location',
			location: currentLocation,
			description: 'Starting point (from browser geolocation)',
		}
	}, [currentLocation])

	const optimizedItinerary = useMemo(() => {
		const raw = result?.optimized_itinerary
		if (!Array.isArray(raw) || raw.length === 0) return []
		let normalized = normalizeOptimizedItinerary(raw)

		// If backend returns the start/current-location point without the expected id,
		// fix it so numbering starts at 1 for the first destination.
		if (currentLocation && normalized.length) {
			const first = normalized[0]
			const dist = approxDistanceMeters(first?.location, currentLocation)
			if (dist < 80) {
				normalized = [
					{ ...first, id: 'start-user-location', name: 'Your location', location: currentLocation },
					...normalized.slice(1),
				]
			}
		}

		// IMPORTANT: keep IDs stable by matching optimized points back to the user's selected itinerary.
		// This ensures visited toggles and marker icons change correctly.
		if (!selectedItinerary.length) return normalized

		const unused = new Map(selectedItinerary.map((d) => [d.id, d]))
		const matched = normalized.map((p) => {
			if (p.id === 'start-user-location') return p
			let best = null
			let bestDist = Number.POSITIVE_INFINITY
			for (const cand of unused.values()) {
				const dist = approxDistanceMeters(p.location, cand.location)
				if (dist < bestDist) {
					bestDist = dist
					best = cand
				}
			}
			// 250m tolerance to be robust across rounding/geocoding differences.
			if (best && bestDist <= 250) {
				unused.delete(best.id)
				return toStableStop(best, p)
			}
			return p
		})

		return matched
	}, [result, currentLocation, selectedItinerary])

	const remainingItinerary = useMemo(() => {
		return selectedItinerary.filter((d) => !visitedIdSet.has(d.id))
	}, [selectedItinerary, visitedIdSet])

	const visitedItinerary = useMemo(() => {
		return selectedItinerary.filter((d) => visitedIdSet.has(d.id))
	}, [selectedItinerary, visitedIdSet])

	const isCatalogView = useMemo(() => {
		if (itinerarySource === 'manual') return normalizeItineraryItems(manualItinerary).length === 0
		if (itinerarySource === 'generator') return generatedItinerary.length === 0
		return false
	}, [itinerarySource, manualItinerary, generatedItinerary])

	// For routing / optimization (visited places removed). Route is only shown after Optimize (or during navigation).
	const itineraryWithStart = useMemo(() => {
		const base = remainingItinerary
		if (startPlace) return [startPlace, ...base]
		return base
	}, [startPlace, remainingItinerary])

	// Map markers: first show catalog; after user selects destinations, show only selected.
	const mapStops = useMemo(() => {
		if (itinerarySource === 'manual') {
			const list = normalizeItineraryItems(manualItinerary)
			return list.length ? list : catalogDestinations
		}
		if (itinerarySource === 'generator') {
			return generatedItinerary.length ? generatedItinerary : catalogDestinations
		}
		return mockItinerary
	}, [itinerarySource, manualItinerary, generatedItinerary, catalogDestinations])

	const markerItineraryWithStart = useMemo(() => {
		if (startPlace) return [startPlace, ...mapStops]
		return mapStops
	}, [startPlace, mapStops])

	const showRoute = Boolean(optimizedItinerary.length) || navActive
	const activeItinerary = optimizedItinerary.length ? optimizedItinerary : itineraryWithStart

	const routeOrderLabelById = useMemo(() => {
		const isStart = (d) => {
			if (!d) return false
			if (d.id === 'start-user-location') return true
			if (!currentLocation) return false
			// Extra guard: treat a point very close to current location as start.
			// This prevents numbering from starting at 2 when backend doesn't preserve the id.
			return approxDistanceMeters(d.location, currentLocation) < 80
		}
		const map = new Map()
		const stopsOnly = activeItinerary.filter((d) => !isStart(d))
		stopsOnly.forEach((d, idx) => map.set(d.id, String(idx + 1)))
		return map
	}, [activeItinerary, currentLocation])

	const markerOrderLabelById = useMemo(() => {
		// If we're showing the catalog, don't number everything.
		if (isCatalogView) return new Map()
		if (showRoute && routeOrderLabelById.size) return routeOrderLabelById
		const map = new Map()
		const stopsOnly = mapStops.filter((d) => d.id !== 'start-user-location')
		stopsOnly.forEach((d, idx) => map.set(d.id, String(idx + 1)))
		return map
	}, [isCatalogView, showRoute, routeOrderLabelById, mapStops])

	const pathPoints = useMemo(() => {
		const pts = activeItinerary.map((d) => ({ lat: d.location.lat, lng: d.location.lng }))
		if (returnToStart && pts.length > 1) pts.push(pts[0])
		return pts
	}, [activeItinerary, returnToStart])

	const markerPoints = useMemo(() => {
		return markerItineraryWithStart
			.filter((d) => d.id !== 'start-user-location')
			.map((d) => ({ lat: d.location.lat, lng: d.location.lng }))
	}, [markerItineraryWithStart])

	const center = useMemo(() => computeCenter(showRoute ? pathPoints : markerPoints), [showRoute, pathPoints, markerPoints])

	const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
	const visitedMarkerUrl = useMemo(() => `${import.meta.env.BASE_URL}visited-pin.svg`, [])
	const backendBaseUrl = useMemo(() => {
		const fromEnv = import.meta.env.VITE_ROUTE_OPTIMIZER_BASE_URL
		if (fromEnv) return String(fromEnv).replace(/\/$/, '')
		// In dev we rely on Vite proxy (/api -> localhost:8000).
		// In production (or file:// builds), there is no proxy, so default to local backend.
		if (import.meta.env.DEV) return ''
		return 'http://localhost:8000'
	}, [])

	function resolveBackendUrl(path) {
		const cleanPath = path.startsWith('/') ? path : `/${path}`
		return backendBaseUrl ? `${backendBaseUrl}${cleanPath}` : `/api${cleanPath}`
	}
	const { isLoaded } = useJsApiLoader({
		id: 'ceylonroam-google-maps',
		googleMapsApiKey: googleMapsApiKey || '',
	})

	const trafficEnabled = optMode !== 'distance'

	useEffect(() => {
		// Build a real route to display (preserving our optimized order).
		if (!isLoaded) return
		if (!googleMapsApiKey) return
		if (!showRoute) {
			setDirections(null)
			setDirectionsTotals({ durationS: null, trafficS: null })
			setNavSteps([])
			setNavStepFlatIndex(0)
			return
		}
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
	}, [activeItinerary, isLoaded, googleMapsApiKey, returnToStart, travelMode, navActive, currentLocation, navTick, showRoute])

	useEffect(() => {
		if (!navActive) return
		const t = window.setInterval(() => setNavTick((x) => x + 1), 30000)
		return () => window.clearInterval(t)
	}, [navActive])

	useEffect(() => {
		// Fetch traffic-on-polyline intervals from backend (Routes API) for closer Google Maps-like coloring.
		if (!googleMapsApiKey) return
		if (!isLoaded) return
		if (!showRoute) {
			setTrafficRoute(null)
			setTrafficRouteError('')
			return
		}
		if (travelMode !== 'DRIVING') {
			setTrafficRoute(null)
			setTrafficRouteError('')
			return
		}
		if (!activeItinerary || activeItinerary.length < 2) return

		const url = resolveBackendUrl('/traffic-route')

		const stops = activeItinerary.filter((d) => d.id !== 'start-user-location')
		const origin = navActive && currentLocation
			? currentLocation
			: { lat: activeItinerary[0].location.lat, lng: activeItinerary[0].location.lng }
		const destination = returnToStart
			? origin
			: { lat: stops[stops.length - 1].location.lat, lng: stops[stops.length - 1].location.lng }
		const intermediates = stops.slice(0, returnToStart ? undefined : -1).map((d) => ({
			lat: d.location.lat,
			lng: d.location.lng,
		}))

		setTrafficRouteError('')
		let cancelled = false

		;(async () => {
			try {
				const res = await fetch(url, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						origin,
						destination,
						intermediates,
						travel_mode: vehicleType === 'motorcycle' ? 'TWO_WHEELER' : 'DRIVE',
					}),
				})

				if (!res.ok) {
					const text = await res.text()
					if (res.status === 404) {
						throw new Error(
							`Traffic route endpoint not found (404). Start the backend and ensure it has /traffic-route. If you're running a production build, set VITE_ROUTE_OPTIMIZER_BASE_URL to your backend URL.`,
						)
					}
					throw new Error(text || `Traffic route request failed (${res.status})`)
				}
				const json = await res.json()
				if (cancelled) return

				const legs = (json.legs || []).map((leg) => {
					const points = decodePolyline(leg.encoded_polyline)
					return {
						points,
						intervals: (leg.speed_intervals || []).map((i) => ({
							startIndex: i.start_index,
							endIndex: i.end_index,
							speed: i.speed,
						})),
					}
				})

				setTrafficRoute({
					durationS: json.duration_seconds ?? null,
					distanceM: json.distance_meters ?? null,
					legs,
				})
			} catch (e) {
				if (cancelled) return
				setTrafficRoute(null)
				setTrafficRouteError(
					e?.message ||
					'Unable to fetch traffic-on-polyline. Ensure backend GOOGLE_MAPS_API_KEY has Routes API enabled.',
				)
			}
		})()

		return () => {
			cancelled = true
		}
	}, [googleMapsApiKey, isLoaded, travelMode, vehicleType, activeItinerary, currentLocation, navActive, navTick, returnToStart, showRoute])

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
			const url = resolveBackendUrl('/optimize')

			if (selectedItinerary.length === 0) {
				setResult(null)
				throw new Error('Add destinations first, then click “Optimize route”.')
			}

			if (remainingItinerary.length === 0) {
				setResult(null)
				throw new Error('All selected places are marked visited. Uncheck a place (or clear visited) to plan a route.')
			}

			// If we have a current location, force the route to start from it
			// by prepending it at index 0 and turning off try_all_starts.
			const effectiveTryAllStarts = currentLocation ? false : tryAllStarts
			const effectiveItinerary = currentLocation && startPlace
				? [startPlace, ...remainingItinerary]
				: remainingItinerary

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
			{trafficRouteError ? <div className="ro-error">{trafficRouteError}</div> : null}

			<main className="ro-grid">
				<section className="ro-card ro-left">
					<h2 className="ro-h2">Itinerary</h2>
					<div className="ro-source">
						<label className="ro-toggle" title="Choose where destinations come from">
							Source
							<select
								value={itinerarySource}
								onChange={(e) => setItinerarySource(e.target.value)}
								style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 8 }}
							>
								<option value="manual">Manual</option>
								<option value="generator">Itinerary generator</option>
								<option value="demo">Demo (mock)</option>
							</select>
						</label>

						{itinerarySource === 'generator' ? (
							<button className="ro-button ro-button-secondary" onClick={loadGeneratedItineraryFromStorage}>
								Reload
							</button>
						) : null}
					</div>
					{itinerarySource === 'generator' && generatorLoadError ? (
						<div className="ro-error" style={{ marginTop: 10 }}>
							{generatorLoadError}
						</div>
					) : null}

					<div style={{ marginTop: 10 }}>
						<h3 className="ro-h3">Available destinations</h3>
						<ul className="ro-list ro-list-plain">
							{catalogDestinations.map((d) => (
								<li key={d.id} className="ro-item">
									<div className="ro-item-row">
										<div className="ro-item-title">{d.name}</div>
										{itinerarySource === 'manual' ? (
											<button className="ro-button ro-mini" onClick={() => addManualFromCatalog(d.id)}>
												Add
											</button>
										) : null}
									</div>
								</li>
							))}
						</ul>
						{itinerarySource === 'manual' && !manualItinerary.length && savedManualItinerary.length ? (
							<button
								className="ro-button ro-button-secondary"
								onClick={() => setManualItinerary(savedManualItinerary)}
								style={{ width: '100%', marginTop: 8 }}
							>
								Load previous selection ({savedManualItinerary.length})
							</button>
						) : null}
						{itinerarySource !== 'manual' ? (
							<div className="ro-visit-hint">Switch to Manual to add destinations from this list.</div>
						) : null}
					</div>

					{itinerarySource === 'manual' ? (
						<div className="ro-manual">
							<h3 className="ro-h3">Add custom</h3>
							<div className="ro-manual-grid">
								<input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Name" />
								<input value={customLat} onChange={(e) => setCustomLat(e.target.value)} placeholder="Latitude" />
								<input value={customLng} onChange={(e) => setCustomLng(e.target.value)} placeholder="Longitude" />
								<input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="Description (optional)" />
							</div>
							<button className="ro-button" onClick={addManualCustom} style={{ marginTop: 8 }}>
								Add custom destination
							</button>
						</div>
					) : null}

					{selectedItinerary.length ? (
					<div className="ro-visit-controls">
						<div className="ro-visit-meta">
							Visited: <strong>{visitedItinerary.length}</strong> / {selectedItinerary.length}
						</div>
						<button className="ro-button ro-button-secondary" onClick={clearVisited} disabled={!visitedItinerary.length}>
							Clear visited
						</button>
					</div>
					) : (
						<div className="ro-empty" style={{ marginTop: 10 }}>
							Add destinations to see them on the map, then click “Optimize route” to draw the route.
						</div>
					)}
					{selectedItinerary.length ? (
						<div className="ro-visit-hint">Tick places as visited to remove them from the remaining route.</div>
					) : null}

					<h3 className="ro-h3">Remaining route</h3>
					<ol className="ro-list">
						{activeItinerary.length ? (
							activeItinerary.map((d, idx) => (
								<li key={d.id} className="ro-item">
									<div className="ro-item-row">
										<div className="ro-item-title">{d.name}</div>
										{d.id !== 'start-user-location' ? (
											<div className="ro-item-actions">
												<label className="ro-visit-toggle" title="Mark this place as visited">
													<input
														type="checkbox"
														checked={visitedIdSet.has(d.id)}
														onChange={(e) => setVisited(d.id, e.target.checked)}
													/>
													Visited
												</label>

												{itinerarySource === 'manual' && !result?.optimized_itinerary?.length ? (
													<div className="ro-manual-actions">
														<button
															className="ro-button ro-button-secondary ro-mini"
															onClick={() => moveManual(d.id, 'up')}
															disabled={normalizeItineraryItems(manualItinerary).findIndex((x) => x.id === d.id) <= 0}
															title="Move up"
														>
															↑
														</button>
														<button
															className="ro-button ro-button-secondary ro-mini"
															onClick={() => moveManual(d.id, 'down')}
															disabled={
															normalizeItineraryItems(manualItinerary).findIndex((x) => x.id === d.id) >=
															normalizeItineraryItems(manualItinerary).length - 1
														}
															title="Move down"
														>
															↓
														</button>
														<button
															className="ro-button ro-button-danger ro-mini"
															onClick={() => removeManual(d.id)}
															title="Remove"
														>
															Remove
														</button>
													</div>
												) : null}
											</div>
										) : null}
									</div>
								<div className="ro-item-meta">
									{round2(d.location.lat)}, {round2(d.location.lng)}
								</div>
								{d.description ? <div className="ro-item-desc">{d.description}</div> : null}
								</li>
							))
						) : (
							<div className="ro-empty">No selected places yet. Add destinations above.</div>
						)}
					</ol>

					{visitedItinerary.length ? (
						<>
							<h3 className="ro-h3">Visited</h3>
							<ul className="ro-list ro-list-plain">
								{visitedItinerary.map((d) => (
									<li key={d.id} className="ro-item ro-item-visited">
										<div className="ro-item-row">
											<div className="ro-item-title">{d.name}</div>
											<label className="ro-visit-toggle" title="Uncheck to add back to the route">
												<input
													type="checkbox"
													checked={visitedIdSet.has(d.id)}
													onChange={(e) => setVisited(d.id, e.target.checked)}
												/>
												Visited
											</label>
										</div>
										<div className="ro-item-meta">
											{round2(d.location.lat)}, {round2(d.location.lng)}
										</div>
									</li>
								))}
							</ul>
						</>
					) : null}

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

								{markerItineraryWithStart.map((d) => {
									const isUser = d.id === 'start-user-location'
									const isVisited = !isUser && !isCatalogView && visitedIdSet.has(d.id)
									const routeLabel = !isUser ? markerOrderLabelById.get(d.id) : null
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
										: isLoaded && isVisited && window.google?.maps
											? {
												url: visitedMarkerUrl,
												scaledSize: window.google.maps.Size ? new window.google.maps.Size(40, 40) : undefined,
												anchor: window.google.maps.Point ? new window.google.maps.Point(20, 40) : undefined,
											}
											: undefined
									return (
										<MarkerF
											key={d.id}
											position={{ lat: d.location.lat, lng: d.location.lng }}
											icon={icon}
											opacity={1}
											label={
												isUser
													? navActive
														? null
														: { text: 'Start', fontWeight: '800' }
												: isVisited
													? null
													: routeLabel
														? { text: routeLabel, fontWeight: '800' }
														: null
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
										const fromActive = markerItineraryWithStart.find((x) => x.id === selectedMarkerId)
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

							{showRoute && pathPoints.length > 1 ? (
								directions ? (
									(() => {
										const route = directions?.routes?.[0]
										const legs = route?.legs || []
										const isDriving =
											travelMode === 'DRIVING' && window.google?.maps?.TravelMode?.DRIVING

										// Prefer backend Routes API traffic-on-polyline (segment-level speeds).
										if (trafficRoute?.legs?.length) {
											const allPoints = trafficRoute.legs.flatMap((l) => l.points)
											return (
												<>
													{allPoints.length ? (
														<PolylineF
															path={allPoints}
															options={{
																strokeColor: 'rgba(17, 24, 39, 0.55)',
																strokeOpacity: 0.8,
																strokeWeight: 10,
																zIndex: 4,
														}} 
														/>
													) : null}

												{trafficRoute.legs.map((leg, legIndex) =>
													(leg.intervals?.length ? leg.intervals : [{ startIndex: 0, endIndex: leg.points.length - 1, speed: 'NORMAL' }]).map(
														(it, intIndex) => {
																const start = Math.max(0, it.startIndex)
																const end = Math.min(leg.points.length - 1, it.endIndex)
																const path = leg.points.slice(start, end + 1)
																if (path.length < 2) return null
																return (
																	<PolylineF
																		key={`tr-leg-${legIndex}-int-${intIndex}`}
																		path={path}
																		options={{
																		strokeColor: trafficColorForSpeed(it.speed),
																		strokeOpacity: 0.95,
																		strokeWeight: 6,
																		zIndex: 5,
																	}}
																	/>
																)
															},
														),
												)}
												</>
											)
										}

										// Fallback: draw the route ourselves so we can color by traffic (approx by leg ratio).
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
												(trafficRoute?.durationS ?? (directionsTotals.trafficS ?? directionsTotals.durationS)) != null
													? (trafficRoute?.durationS ?? (directionsTotals.trafficS ?? directionsTotals.durationS)) / 60
													: null,
											)}
										</div>
										<div className="ro-nav-eta-sub">
											{trafficRoute?.distanceM != null
												? formatDistance(trafficRoute.distanceM)
												: directions?.routes?.[0]?.legs
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
												const s = trafficRoute?.durationS ?? (directionsTotals.trafficS ?? directionsTotals.durationS)
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
