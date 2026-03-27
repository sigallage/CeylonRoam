import { useEffect, useMemo, useRef, useState } from 'react'
import { getAuthBaseUrl, getRouteOptimizerBaseUrl } from '../../config/backendUrls'
import { Capacitor } from '@capacitor/core'
import {
	GoogleMap,
	InfoWindowF,
	MarkerF,
	PolylineF,
	TrafficLayer,
	CircleF,
	useJsApiLoader,
} from '@react-google-maps/api'
import { FiPlus } from 'react-icons/fi'
import { BiTrash } from 'react-icons/bi'

import destinationsRaw from '../../dataset/destinations.json'

// Transform destinations.json format
const destinationData = destinationsRaw.map(dest => ({
	id: dest.id || dest.name,
	name: dest.name,
	location: { lat: dest.latitude, lng: dest.longitude },
	description: dest.description || '',
}))

const BUILD_STAMP = import.meta.env.VITE_BUILD_STAMP || 'dev'

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 }
const SRI_LANKA_BOUNDS = {
	north: 10.05,
	south: 5.75,
	east: 82.20,
	west: 79.45,
}

const ROUTE_OPTIMIZER_GENERATED_ITIN_KEY = 'ceylonroam:itineraryGenerator:itinerary:v1'
const ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_KEY = 'ceylonroam:itineraryGenerator:itineraryHistory:v1'
const ROUTE_OPTIMIZER_SIDEBAR_OPEN_KEY = 'ceylonroam:routeOptimizer:sidebarOpen:v1'

// Eco-travel tips
const ECO_TIPS = [
	'Your optimized route reduces carbon footprint by 12% compared to standard paths.',
	'Combining multiple stops into one trip saves fuel and reduces CO₂ emissions.',
	'Every km saved on your route equals less pollution and cleaner air for all.',
	'Smart routing = lower emissions. You\'re making a sustainable travel choice!',
	'Congestion-aware routing minimizes engine idling and fuel waste.',
	'Optimized routes mean shorter driving time and lower fuel consumption.',
	'Your route avoids traffic hotspots, reducing emissions by up to 15%.',
	'Efficient navigation supports a greener Sri Lanka for future travelers.',
	'Multi-stop optimization cuts unnecessary detours and saves fuel.',
]

// ==================== Utility Functions ====================

function round2(n) {
	return Math.round(n * 100) / 100
}

function formatMinutesToHhMm(totalMinutes) {
	if (totalMinutes == null || Number.isNaN(totalMinutes)) return '—'
	const minutes = Math.round(totalMinutes)
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	if (h <= 0) return `${m}m`
	return `${h}h ${m}m`
}

function formatDistance(meters) {
	if (meters == null || Number.isNaN(meters)) return '—'
	if (meters < 1000) return `${Math.round(meters)}m`
	const km = meters / 1000
	return `${km >= 10 ? Math.round(km) : Math.round(km * 10) / 10}km`
}

function formatShortDistance(meters) {
	if (meters == null || Number.isNaN(meters)) return '—'
	if (meters < 950) return `${Math.round(meters)} m`
	return `${(meters / 1000).toFixed(1)} km`
}

function formatEtaFromNow(durationSeconds) {
	if (durationSeconds == null || Number.isNaN(durationSeconds)) return '—'
	try {
		const t = new Date(Date.now() + Math.max(0, Number(durationSeconds)) * 1000)
		const hh = String(t.getHours()).padStart(2, '0')
		const mm = String(t.getMinutes()).padStart(2, '0')
		return `${hh}:${mm}`
	} catch {
		return '—'
	}
}

function formatTimeOfDay(date) {
	try {
		return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date)
	} catch {
		return date.toLocaleTimeString()
	}
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

function trafficColorForLeg(leg) {
	const base = leg?.duration?.value
	const traffic = leg?.duration_in_traffic?.value
	if (!base || !traffic) return '#1e3a8a'
	const ratio = traffic / base
	if (ratio <= 1.12) return '#1e3a8a'
	if (ratio <= 1.35) return '#f59e0b'
	return '#ef4444'
}

function trafficColorForSpeed(speed) {
	if (speed === 'NORMAL') return '#1e3a8a'
	if (speed === 'SLOW') return '#f59e0b'
	if (speed === 'TRAFFIC_JAM') return '#ef4444'
	return '#1e3a8a'
}

function isValidLatLngLiteral(p) {
	if (!p || typeof p !== 'object') return false
	const lat = Number(p.lat)
	const lng = Number(p.lng)
	return Number.isFinite(lat) && Number.isFinite(lng)
}

function formatShortDate(dateString) {
	if (!dateString) return '—'
	try {
		const date = new Date(dateString)
		if (Number.isNaN(date.getTime())) return '—'
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
	} catch {
		return '—'
	}
}

function buildRouteOptimizerStopsFromAiResponse(aiResponse, catalogStops) {
	const summary = typeof aiResponse?.summary === 'string' ? aiResponse.summary : ''
	const itinerary = typeof aiResponse?.itinerary === 'string' ? aiResponse.itinerary : ''
	const haystack = `${summary}\n${itinerary}`.toLowerCase()

	const matches = catalogStops
		.map(stop => ({
			idx: haystack.indexOf(String(stop.name || '').toLowerCase()),
			stop,
		}))
		.filter(m => m.idx >= 0)
		.sort((a, b) => a.idx - b.idx)

	const uniqueIds = new Set()
	const stops = []
	for (const { stop } of matches) {
		if (!stop?.id || uniqueIds.has(stop.id)) continue
		uniqueIds.add(stop.id)
		stops.push({
			id: stop.id,
			name: stop.name,
			location: stop.location,
			description: stop.description || '',
		})
		if (stops.length >= 30) break
	}

	return stops
}

export default function RouteOptimizer() {
	useEffect(() => {
		// Helps verify Vercel is serving the latest bundle.
		// Safe in prod: minimal log, no PII.
		try {
			console.info(`[CeylonRoam] RouteOptimizer build=${BUILD_STAMP}; catalogDestinations=${destinationData.length}`)
		} catch {
			// ignore
		}
	}, [])

	let googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
	try {
		if (Capacitor.isNativePlatform?.()) {
			googleMapsApiKey = import.meta.env.VITE_NATIVE_GOOGLE_MAPS_API_KEY || googleMapsApiKey
		}
	} catch {
		// ignore
	}

	const [currentLocation, setCurrentLocation] = useState(null)
	const [locationError, setLocationError] = useState('')
	const [selectedMarkerId, setSelectedMarkerId] = useState(null)
	const [manualItinerary, setManualItinerary] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [result, setResult] = useState(null)
	const [returnToStart, setReturnToStart] = useState(false)
	const [optMode, setOptMode] = useState('distance')
	const [travelMode, setTravelMode] = useState('DRIVING')
	const [navActive, setNavActive] = useState(false)
	const [followUser, setFollowUser] = useState(true)
	const [showTrafficLayer, setShowTrafficLayer] = useState(true)
	const [routePreviewActive, setRoutePreviewActive] = useState(false)
	const [directions, setDirections] = useState(null)
	const [directionsTotals, setDirectionsTotals] = useState({ durationS: null, distanceM: null, originalDistanceKm: null })
	const [mapsReady, setMapsReady] = useState(false)
	const [customName, setCustomName] = useState('')
	const [customLat, setCustomLat] = useState('')
	const [customLng, setCustomLng] = useState('')
	const [customDesc, setCustomDesc] = useState('')
	const [showCustomForm, setShowCustomForm] = useState(false)
	const [visitedIds, setVisitedIds] = useState([])
	const [navTick, setNavTick] = useState(0)
	const [userAccuracyM, setUserAccuracyM] = useState(null)
	const [userSpeedKmh, setUserSpeedKmh] = useState(0)
	const [userHeadingDeg, setUserHeadingDeg] = useState(null)
	const [ecoTipIndex, setEcoTipIndex] = useState(0)

	// If the itinerary generator produced route-optimizer stops, load the latest set
	// On reopen, start fresh: keep destinations visible but clear any previously
	// generated/current route state that may be persisted in localStorage.
	useEffect(() => {
		try {
			window.localStorage.removeItem(ROUTE_OPTIMIZER_GENERATED_ITIN_KEY)
			window.localStorage.removeItem(ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_KEY)
		} catch {
			// ignore
		}
		setManualItinerary([])
		setVisitedIds([])
		setResult(null)
		setRoutePreviewActive(false)
	}, [])
	const [currentStepIndex, setCurrentStepIndex] = useState(0)
	const [showSavedItineraries, setShowSavedItineraries] = useState(false)
	const [savedItineraries, setSavedItineraries] = useState([])
	const [savedLoading, setSavedLoading] = useState(false)
	const [savedError, setSavedError] = useState('')
	const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
		try {
			const raw = window.localStorage.getItem(ROUTE_OPTIMIZER_SIDEBAR_OPEN_KEY)
			if (raw == null) return true
			return raw === 'true'
		} catch {
			return true
		}
	})

	useEffect(() => {
		try {
			window.localStorage.setItem(ROUTE_OPTIMIZER_SIDEBAR_OPEN_KEY, String(Boolean(isSidebarOpen)))
		} catch {
			// ignore
		}
	}, [isSidebarOpen])

	const mapRef = useRef(null)
	const rightMapSectionRef = useRef(null)
	const navOverlayCardRef = useRef(null)
	const locationRequestedRef = useRef(false)
	const locationWatchIdRef = useRef(null)
	const navDragRef = useRef({ pointerId: null, startX: 0, startY: 0, originX: 16, originY: 16 })

	const [navCardPos, setNavCardPos] = useState(null) // { x, y }
	const [navCardDragging, setNavCardDragging] = useState(false)

	// Get current location
	useEffect(() => {
		if (locationRequestedRef.current) return
		locationRequestedRef.current = true
		
		if (!navigator.geolocation) {
			setLocationError('Geolocation not supported')
			return
		}

		setLocationError('')
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
				setSelectedMarkerId('start-user-location')
				if (Number.isFinite(pos.coords.speed)) {
					setUserSpeedKmh(Math.max(0, Math.round(pos.coords.speed * 3.6)))
				}
				if (Number.isFinite(pos.coords.heading)) {
					setUserHeadingDeg(((Number(pos.coords.heading) % 360) + 360) % 360)
				}
			},
			(err) => {
				setLocationError('Enable location permissions to use this feature')
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
		)
	}, [])

	// Live location updates while navigating
	useEffect(() => {
		if (!navActive) return
		if (!navigator.geolocation) {
			setLocationError('Geolocation not supported')
			return
		}

		setLocationError('')
		try {
			const watchId = navigator.geolocation.watchPosition(
				(pos) => {
					setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
					setUserAccuracyM(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null)
					if (Number.isFinite(pos.coords.speed)) {
						setUserSpeedKmh(Math.max(0, Math.round(pos.coords.speed * 3.6)))
					}
					if (Number.isFinite(pos.coords.heading)) {
						setUserHeadingDeg(((Number(pos.coords.heading) % 360) + 360) % 360)
					}
				},
				() => {
					setLocationError('Enable location permissions to use this feature')
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
			)
			locationWatchIdRef.current = watchId
		} catch {
			locationWatchIdRef.current = null
		}

		return () => {
			const watchId = locationWatchIdRef.current
			locationWatchIdRef.current = null
			if (watchId != null) {
				try {
					navigator.geolocation.clearWatch(watchId)
				} catch {
					// ignore
				}
			}
		}
	}, [navActive])

	// Device compass heading fallback (helps when GPS heading isn't available)
	useEffect(() => {
		if (!navActive) return
		if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
		if (!('DeviceOrientationEvent' in window)) return

		const onOrientation = (ev) => {
			try {
				let heading = null
				if (typeof ev?.webkitCompassHeading === 'number' && Number.isFinite(ev.webkitCompassHeading)) {
					heading = ev.webkitCompassHeading
				} else if (typeof ev?.alpha === 'number' && Number.isFinite(ev.alpha)) {
					const a = Number(ev.alpha)
					heading = ((360 - a) % 360 + 360) % 360
				}
				if (heading == null || !Number.isFinite(heading)) return
				setUserHeadingDeg(((Number(heading) % 360) + 360) % 360)
			} catch {
				// ignore
			}
		}

		window.addEventListener('deviceorientationabsolute', onOrientation, true)
		window.addEventListener('deviceorientation', onOrientation, true)
		return () => {
			window.removeEventListener('deviceorientationabsolute', onOrientation, true)
			window.removeEventListener('deviceorientation', onOrientation, true)
		}
	}, [navActive])

	function pickBestRoute(result, { preferTrafficTime }) {
		try {
			const routes = Array.isArray(result?.routes) ? result.routes : []
			if (routes.length <= 1) return result

			let bestIdx = 0
			let bestScore = Number.POSITIVE_INFINITY

			routes.forEach((route, idx) => {
				const legs = route?.legs || []
				let totalDistance = 0
				let totalDuration = 0
				for (const leg of legs) {
					totalDistance += leg?.distance?.value || 0
					if (preferTrafficTime) {
						totalDuration += leg?.duration_in_traffic?.value || leg?.duration?.value || 0
					} else {
						totalDuration += leg?.duration?.value || 0
					}
				}

				const score = preferTrafficTime ? totalDuration : totalDistance
				if (score > 0 && score < bestScore) {
					bestScore = score
					bestIdx = idx
				}
			})

			const chosen = routes[bestIdx]
			if (!chosen) return result
			return { ...result, routes: [chosen] }
		} catch {
			return result
		}
	}

	// Update directions (only when a route is requested)
	useEffect(() => {
		if (!mapsReady || !googleMapsApiKey || !window.google?.maps) return
		if (!routePreviewActive || manualItinerary.length < 1) {
			setDirections(null)
			return
		}

		const origin = currentLocation || {
			lat: manualItinerary[0].location.lat,
			lng: manualItinerary[0].location.lng,
		}

		const waypoints = manualItinerary.slice(0, -1).map(d => ({
			location: { lat: d.location.lat, lng: d.location.lng },
			stopover: true,
		}))

		const destination = returnToStart
			? origin
			: {
				lat: manualItinerary[manualItinerary.length - 1].location.lat,
				lng: manualItinerary[manualItinerary.length - 1].location.lng,
			}

		const service = new window.google.maps.DirectionsService()
		service.route(
			{
				origin,
				destination,
				waypoints: waypoints.length > 0 ? waypoints : undefined,
				optimizeWaypoints: false,
				travelMode: window.google.maps.TravelMode[travelMode] || window.google.maps.TravelMode.DRIVING,
				provideRouteAlternatives: true,
				...(navActive && travelMode === 'DRIVING'
					? {
						drivingOptions: {
							departureTime: new Date(),
							trafficModel: window.google.maps.TrafficModel?.BEST_GUESS || 'bestguess',
						},
					}
					: {}),
			},
			(result, status) => {
				if (status === 'OK' && result) {
					const chosen = pickBestRoute(result, { preferTrafficTime: Boolean(navActive && travelMode === 'DRIVING') })
					setDirections(chosen)
					const legs = chosen.routes?.[0]?.legs || []
					let totalDuration = 0
					let totalDistance = 0
					for (const leg of legs) {
						if (navActive && travelMode === 'DRIVING') {
							totalDuration += leg?.duration_in_traffic?.value || leg?.duration?.value || 0
						} else {
							totalDuration += leg?.duration?.value || 0
						}
						totalDistance += leg?.distance?.value || 0
					}
					setDirectionsTotals({ durationS: totalDuration, distanceM: totalDistance })
				} else {
					setDirections(null)
				}
			}
		)
	}, [mapsReady, googleMapsApiKey, manualItinerary, returnToStart, travelMode, currentLocation, navActive, navTick, routePreviewActive])

	// Navigation timer
	useEffect(() => {
		if (!navActive) return
		const interval = setInterval(() => setNavTick(x => x + 1), 30000)
		return () => clearInterval(interval)
	}, [navActive])

	// Pan to user
	useEffect(() => {
		if (!navActive || !followUser || !currentLocation || !mapRef.current) return
		mapRef.current.panTo(currentLocation)
		if (mapRef.current.getZoom() < 12) mapRef.current.setZoom(13)
	}, [navActive, followUser, currentLocation])

	const visitedSet = useMemo(() => new Set(visitedIds), [visitedIds])

	const startPlace = currentLocation ? {
		id: 'start-user-location',
		name: 'Your location',
		location: currentLocation,
		description: 'Starting point',
	} : null

	// Ensure we never duplicate the synthetic start marker.
	// `manualItinerary` can temporarily contain it after optimization responses.
	const remainingItinerary = manualItinerary.filter(d => d?.id !== 'start-user-location')

	// Route path should exclude visited stops (so navigation/preview auto-updates),
	// but the list UI can still show them with a tick.
	const routeItineraryStops = remainingItinerary.filter(d => !visitedSet.has(d.id))

	const activeItinerary = startPlace && routeItineraryStops.length > 0
		? [startPlace, ...routeItineraryStops]
		: routeItineraryStops

	function toggleVisited(id) {
		if (!id || id === 'start-user-location') return
		setVisitedIds(prev => {
			const next = Array.isArray(prev) ? [...prev] : []
			const idx = next.indexOf(id)
			if (idx >= 0) {
				next.splice(idx, 1)
				return next
			}
			next.push(id)
			return next
		})
	}

	const pathPoints = activeItinerary.map(d => ({
		lat: Number(d.location.lat),
		lng: Number(d.location.lng),
	}))
	if (returnToStart && pathPoints.length > 1) pathPoints.push(pathPoints[0])

	const mapCenter = pathPoints.length > 0
		? {
			lat: pathPoints.reduce((a, p) => a + p.lat, 0) / pathPoints.length,
			lng: pathPoints.reduce((a, p) => a + p.lng, 0) / pathPoints.length,
		}
		: { lat: 7.8731, lng: 80.7718 }

	function addFromCatalog(id) {
		const d = destinationData.find(x => x.id === id)
		if (!d || manualItinerary.some(x => x.id === id)) return
		setManualItinerary([...manualItinerary, d])
		setResult(null)
		setRoutePreviewActive(false)
	}

	function previewDestinationOnMap(dest) {
		if (!dest?.id) return
		setSelectedMarkerId(dest.id)
		setFollowUser(false)
		try {
			const loc = dest?.location
			if (!loc) return
			const pos = { lat: Number(loc.lat), lng: Number(loc.lng) }
			if (!Number.isFinite(pos.lat) || !Number.isFinite(pos.lng)) return
			if (mapRef.current && typeof mapRef.current.panTo === 'function') {
				mapRef.current.panTo(pos)
				if (typeof mapRef.current.getZoom === 'function' && typeof mapRef.current.setZoom === 'function') {
					if (mapRef.current.getZoom() < 11) mapRef.current.setZoom(11)
				}
			}
		} catch {
			// ignore
		}
	}

	function addCustom() {
		const lat = Number(customLat)
		const lng = Number(customLng)
		if (!customName.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
			setError('Invalid name or coordinates')
			return
		}
		const id = `custom-${Date.now()}`
		setManualItinerary([
			...manualItinerary,
			{ id, name: customName.trim(), location: { lat, lng }, description: customDesc.trim() },
		])
		setCustomName('')
		setCustomLat('')
		setCustomLng('')
		setCustomDesc('')
		setShowCustomForm(false)
		setResult(null)
		setRoutePreviewActive(false)
	}

	function removeManual(id) {
		setManualItinerary(manualItinerary.filter(d => d.id !== id))
		setVisitedIds(prev => (Array.isArray(prev) ? prev.filter(x => x !== id) : []))
		setResult(null)
		setRoutePreviewActive(false)
	}

	function clearAllRoute() {
		setManualItinerary([])
		setVisitedIds([])
		setSelectedMarkerId(null)
		setResult(null)
		setRoutePreviewActive(false)
		setDirections(null)
		setDirectionsTotals({ durationS: null, distanceM: null, originalDistanceKm: null })
		setCurrentStepIndex(0)
		setNavActive(false)
	}

	async function optimize() {
		setError('')
		setLoading(true)
		try {
			const basePath = getRouteOptimizerBaseUrl() || '/api'

			if (remainingItinerary.length === 0) {
				throw new Error('Add destinations to optimize')
			}

			const itinerary = startPlace ? [startPlace, ...remainingItinerary] : remainingItinerary

			// Get the CURRENT distance before optimization
			const currentDistanceKm = directionsTotals.distanceM ? (directionsTotals.distanceM / 1000) : null
			console.log('Current distance before optimization:', currentDistanceKm, 'km')

			const response = await fetch(`${basePath}/optimize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					itinerary,
					return_to_start: returnToStart,
					try_all_starts: !currentLocation,
					metric: optMode === 'distance' ? 'haversine' : 'google',
					optimize_for: optMode === 'time' ? 'time' : 'distance',
				}),
			})

			if (!response.ok) {
				const text = await response.text()
				throw new Error(text || `Failed (${response.status})`)
			}

			const json = await response.json()
			
			// Store both the original distance and result
			if (currentDistanceKm) {
				setDirectionsTotals(prev => ({...prev, originalDistanceKm: currentDistanceKm}))
			}
			
			setResult(json)
			console.log('Optimized distance:', json.total_distance_km, 'km | Original was:', currentDistanceKm, 'km')
			
			// Apply optimized itinerary order if available.
			// The backend may include our synthetic start marker; keep it separate.
			if (json.optimized_itinerary && Array.isArray(json.optimized_itinerary)) {
				setManualItinerary(json.optimized_itinerary.filter(s => s?.id !== 'start-user-location'))
			}
			setRoutePreviewActive(true)
		} catch (e) {
			setError(e?.message || 'Optimization failed')
		} finally {
			setLoading(false)
		}
	}

	function startNavigation() {
		if (!googleMapsApiKey) {
			setError('Missing Google Maps API key. Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env')
			return
		}
		setFollowUser(true)
		setShowTrafficLayer(true)
		setRoutePreviewActive(true)
		setNavActive(true)
		setCurrentStepIndex(0)
		try {
			const DOE = window?.DeviceOrientationEvent
			if (DOE && typeof DOE.requestPermission === 'function') {
				DOE.requestPermission().catch(() => null)
			}
		} catch {
			// ignore
		}
	}

	function stopNavigation() {
		setNavActive(false)
		setFollowUser(true)
		setNavCardDragging(false)
	}

	function clampNumber(value, min, max) {
		const v = Number(value)
		if (!Number.isFinite(v)) return Number.isFinite(min) ? min : 0
		if (!Number.isFinite(min) || !Number.isFinite(max)) return v
		if (max < min) return min
		return Math.min(max, Math.max(min, v))
	}

	// Initialize the draggable navigation card position when navigation starts.
	useEffect(() => {
		if (!navActive) {
			setNavCardPos(null)
			return
		}
		if (navCardPos) return
		const panel = rightMapSectionRef.current
		if (!panel?.getBoundingClientRect) {
			setNavCardPos({ x: 16, y: 16 })
			return
		}
		const rect = panel.getBoundingClientRect()
		const panelW = Number(rect?.width) || 0
		// Prefer centered start; fall back to top-left if we can't measure.
		const desiredMaxW = 520
		const startX = panelW > 0
			? clampNumber(Math.round((panelW - desiredMaxW) / 2), 16, Math.max(16, panelW - 16))
			: 16
		setNavCardPos({ x: startX, y: 16 })
	}, [navActive, navCardPos])

	function beginDragNavCard(e) {
		if (!navActive) return
		// Ignore right/middle clicks.
		if (typeof e.button === 'number' && e.button !== 0) return
		// Don't start drag when clicking actionable elements.
		if (e.target?.closest?.('button')) return
		const pointerId = e.pointerId
		navDragRef.current = {
			pointerId,
			startX: e.clientX,
			startY: e.clientY,
			originX: navCardPos?.x ?? 16,
			originY: navCardPos?.y ?? 16,
		}
		setNavCardDragging(true)
		try {
			e.currentTarget.setPointerCapture(pointerId)
		} catch {
			// ignore
		}
		try {
			e.preventDefault()
		} catch {
			// ignore
		}
	}

	function onDragNavCard(e) {
		if (!navCardDragging) return
		if (navDragRef.current.pointerId != null && e.pointerId !== navDragRef.current.pointerId) return
		const panel = rightMapSectionRef.current
		const card = navOverlayCardRef.current
		const dx = e.clientX - navDragRef.current.startX
		const dy = e.clientY - navDragRef.current.startY
		let nextX = navDragRef.current.originX + dx
		let nextY = navDragRef.current.originY + dy

		if (panel?.getBoundingClientRect && card?.getBoundingClientRect) {
			const panelRect = panel.getBoundingClientRect()
			const cardRect = card.getBoundingClientRect()
			const margin = 8
			const maxX = (Number(panelRect?.width) || 0) - (Number(cardRect?.width) || 0) - margin
			const maxY = (Number(panelRect?.height) || 0) - (Number(cardRect?.height) || 0) - margin
			nextX = clampNumber(nextX, margin, maxX)
			nextY = clampNumber(nextY, margin, maxY)
		}

		setNavCardPos({ x: nextX, y: nextY })
	}

	function endDragNavCard(e) {
		if (!navCardDragging) return
		if (navDragRef.current.pointerId != null && e.pointerId !== navDragRef.current.pointerId) return
		setNavCardDragging(false)
		navDragRef.current.pointerId = null
	}

	function nextEcoTip() {
		setEcoTipIndex((prev) => (prev + 1) % ECO_TIPS.length)
	}

	async function fetchSavedItineraries() {
		setSavedError('')
		setSavedLoading(true)
		try {
			// Prefer the user's saved itinerary history (backend), if logged in.
			const storedUser = localStorage.getItem('ceylonroam_user')
			let token = null
			if (storedUser) {
				try {
					const parsed = JSON.parse(storedUser)
					token = parsed?.token || null
				} catch {
					token = null
				}
			}

			if (token) {
				const authBaseUrl = getAuthBaseUrl()
				const response = await fetch(`${authBaseUrl}/api/itineraries`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
				const text = await response.text()
				let json = null
				if (text) {
					try {
						json = JSON.parse(text)
					} catch {
						json = null
					}
				}
				if (!response.ok) {
					const message = json?.message || (text ? text.slice(0, 200) : '') || `Failed to fetch itineraries (HTTP ${response.status})`
					throw new Error(message)
				}

				const serverItems = Array.isArray(json?.itineraries) ? json.itineraries : []
				const normalized = serverItems.map(item => {
					const derivedStops = buildRouteOptimizerStopsFromAiResponse(item?.itineraryData, destinationData)
					return ({
					id: item?._id || `srv-${item?.createdAt || Date.now()}`,
					title: item?.title || 'Saved itinerary',
					createdAt: item?.createdAt || null,
					startDate: item?.startDate || null,
					endDate: item?.endDate || null,
					itineraryData: item?.itineraryData,
					stops: derivedStops,
				})
				})
				setSavedItineraries(normalized)
				return
			}

			// Fallback: locally generated itinerary history (from Itinerary Generator)
			const rawHistory = localStorage.getItem(ROUTE_OPTIMIZER_GENERATED_ITIN_HISTORY_KEY)
			let history = []
			if (rawHistory) {
				try {
					const parsed = JSON.parse(rawHistory)
					history = Array.isArray(parsed) ? parsed : []
				} catch {
					history = []
				}
			}

			// Backward-compat: if there is no history but there is a last generated itinerary, show it.
			if (history.length === 0) {
				const rawLatest = localStorage.getItem(ROUTE_OPTIMIZER_GENERATED_ITIN_KEY)
				if (rawLatest) {
					try {
						const stops = JSON.parse(rawLatest)
						if (Array.isArray(stops) && stops.length > 0) {
							history = [{ id: 'latest', createdAt: null, stops }]
						}
					} catch {
						// ignore
					}
				}
			}

			const localNormalized = history.map(item => ({
				id: item?.id || `gen-${item?.createdAt || Date.now()}`,
				title: 'Generated itinerary',
				createdAt: item?.createdAt || null,
				startDate: item?.startDate || null,
				endDate: item?.endDate || null,
				stops: item?.stops,
			}))
			setSavedItineraries(localNormalized)
		} catch (e) {
			setSavedItineraries([])
			setSavedError(e?.message || 'Failed to load itineraries')
		} finally {
			setSavedLoading(false)
		}
	}

	function onToggleSavedItineraries() {
		setShowSavedItineraries(prev => {
			const next = !prev
			if (next && savedItineraries.length === 0 && !savedLoading) {
				fetchSavedItineraries()
			}
			return next
		})
	}

	function loadSavedItinerary(itinerary) {
		setError('')
		setSelectedMarkerId(null)
		try {
			const directStops = itinerary?.stops
			const stops = Array.isArray(directStops) && directStops.length > 0
				? directStops
				: buildRouteOptimizerStopsFromAiResponse(itinerary?.itineraryData, destinationData)
			if (!stops.length) {
				setError('Selected itinerary does not contain recognizable destinations for route optimization')
				return
			}
			setManualItinerary(stops)
			setVisitedIds([])
			setResult(null)
			setRoutePreviewActive(false)
			setShowSavedItineraries(false)
		} catch {
			setError('Failed to load the selected itinerary')
		}
	}

	// Extract all steps from directions
	function getAllSteps() {
		if (!directions?.routes?.[0]?.legs) return []
		const steps = []
		directions.routes[0].legs.forEach((leg, legIdx) => {
			leg.steps?.forEach((step, stepIdx) => {
				steps.push({
					instruction: step.instructions || `Step ${steps.length + 1}`,
					distance: step.distance?.text || '',
					duration: step.duration?.text || '',
					legIdx,
					stepIdx
				})
			})
		})
		return steps
	}

	const allSteps = getAllSteps()
	const currentStep = allSteps[currentStepIndex] || null
	const nextStep = currentStepIndex < allSteps.length - 1 ? allSteps[currentStepIndex + 1] : null
	const navDurationText = directionsTotals.durationS
		? (directionsTotals.durationS < 3600
			? `${Math.max(1, Math.round(directionsTotals.durationS / 60))} min`
			: formatMinutesToHhMm(directionsTotals.durationS / 60))
		: '—'
	const navDistanceText = directionsTotals.distanceM ? formatShortDistance(directionsTotals.distanceM) : '—'
	const navEtaText = directionsTotals.durationS ? formatEtaFromNow(directionsTotals.durationS) : '—'

	const showRoute = routePreviewActive && activeItinerary.length >= 2

	return (
		<div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden" style={{
			background: 'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.95) 100%)',
			boxShadow: 'inset 0 0 0 1px rgba(250,204,21,0.1)'
		}}>
			{/* LEFT SIDEBAR */}
			{isSidebarOpen && (
				<div className="w-[350px] bg-gradient-to-b from-slate-800 to-slate-950 border-r border-slate-700/20 overflow-y-auto p-5 flex flex-col gap-5" style={{
					borderRight: '1px solid rgba(250,204,21,0.2)'
				}}>
					<div className="flex items-center justify-start">
						<button
							type="button"
							onClick={() => setIsSidebarOpen(false)}
							title="Close panel"
							className="w-9 h-9 rounded-full flex items-center justify-center text-xl leading-none transition-all"
							style={{
								backgroundColor: 'rgba(250,204,21,0.10)',
								border: '1px solid rgba(250,204,21,0.25)',
								color: '#facc15',
							}}
						>
							×
						</button>
					</div>
				{error && <div className="bg-red-950/15 border border-red-700/30 text-red-300 px-3 py-2 rounded text-sm mb-2">{error}</div>}
				{locationError && <div className="bg-red-950/15 border border-red-700/30 text-red-300 px-3 py-2 rounded text-sm mb-2">{locationError}</div>}

				{/* Route Mode */}
				<div>
					<div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest opacity-90 before:content-[''] before:w-1 before:h-1 before:rounded-full" style={{
						color: '#facc15',
						backgroundColor: 'rgba(250,204,21,0.1)',
						padding: '8px 12px',
						borderRadius: '6px',
						borderLeft: '3px solid #facc15'
					}}>Route Mode</div>
					<div className="flex gap-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700/20">
						<button className="flex-1 px-3 py-2 border border-slate-700/20 bg-slate-700/50 text-slate-300 rounded text-xs font-semibold hover:border-yellow-400 hover:bg-slate-700/80 transition-all active:bg-yellow-400 active:text-black active:border-yellow-400">Manual</button>
						<button
							className="flex-1 px-3 py-2 border border-slate-700/20 bg-slate-700/50 text-slate-300 rounded text-xs font-semibold hover:border-yellow-400 hover:bg-slate-700/80 transition-all"
							onClick={onToggleSavedItineraries}
						>
							Saved Itineraries
						</button>
					</div>
				</div>

				{/* Saved Itineraries */}
				{showSavedItineraries && (
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3">
						<div className="flex items-center justify-between mb-2">
							<div className="text-xs font-semibold uppercase tracking-widest opacity-90" style={{ color: '#facc15' }}>
								Saved Itineraries
							</div>
							<button
								className="text-xs text-slate-300 hover:text-yellow-400 transition-colors disabled:opacity-60"
								onClick={fetchSavedItineraries}
								disabled={savedLoading}
							>
								{savedLoading ? 'Refreshing...' : 'Refresh'}
							</button>
						</div>

						{savedError && (
							<div className="bg-red-950/15 border border-red-700/30 text-red-300 px-3 py-2 rounded text-xs mb-2">
								{savedError}
							</div>
						)}

						{savedLoading ? (
							<div className="text-xs text-slate-400 py-2">Loading saved itineraries...</div>
						) : savedItineraries.length === 0 ? (
							<div className="text-xs text-slate-400 py-2">No saved itineraries found.</div>
						) : (
							<div className="max-h-48 overflow-y-auto">
								{savedItineraries.map(itin => (
									<button
										key={itin.id || `${itin.createdAt || 'unknown'}-${itin.title || 'itinerary'}`}
										className="w-full text-left p-2 rounded hover:bg-slate-700/40 transition-colors"
										onClick={() => loadSavedItinerary(itin)}
										title="Load this itinerary into the route"
									>
										<div className="text-sm font-semibold text-slate-200">{itin.title || 'Itinerary'}</div>
										{(itin.startDate || itin.endDate) && (
											<div className="text-xs text-slate-500">
												{formatShortDate(itin.startDate)}{itin.endDate ? ` - ${formatShortDate(itin.endDate)}` : ''}
											</div>
										)}
										<div className="text-xs text-slate-500">Created: {formatShortDate(itin.createdAt)}</div>
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Available Destinations */}
				<div>
					<div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest opacity-90" style={{color: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #facc15'}}>Available Destinations</div>
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3 max-h-48 overflow-y-auto">
						{destinationData.map(d => (
							<div key={d.id} className="flex items-center justify-between py-2 px-2 border-b border-slate-700/10 last:border-b-0 text-sm">
									<span
										className="flex-1 text-slate-200 hover:text-yellow-400 cursor-pointer transition-colors"
										onClick={() => previewDestinationOnMap(d)}
										title={d.description ? stripHtml(d.description).slice(0, 140) : 'View on map'}
									>
										{d.name}
									</span>
								<button className="px-2 py-1 rounded text-xs transition-all flex items-center gap-1" onClick={() => addFromCatalog(d.id)} title="Add to route" style={{border: '1px solid #f97316', color: '#f97316', background: 'transparent'}}>
									<FiPlus size={14} /> Add
								</button>
							</div>
						))}
					</div>
					<button
						className="w-full mt-2 py-2 bg-transparent rounded text-xs transition-all flex items-center justify-center gap-1"
						onClick={() => setShowCustomForm(!showCustomForm)}
						style={{
							border: '1px dashed #facc15',
							color: '#facc15',
						}}
					>
						<FiPlus size={14} /> Add New Stop
					</button>
				</div>

				{/* Custom Form */}
				{showCustomForm && (
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3 flex flex-col gap-2">
						<input className="px-2 py-2 bg-slate-700/50 border border-slate-700/20 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-600 focus:bg-slate-700/80" placeholder="Name" value={customName} onChange={e => setCustomName(e.target.value)} />
						<input
							className="px-2 py-2 bg-slate-700/50 border border-slate-700/20 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-600 focus:bg-slate-700/80"
							placeholder="Latitude"
							value={customLat}
							onChange={e => setCustomLat(e.target.value)}
							type="number"
							step="0.0001"
						/>
						<input
							className="px-2 py-2 bg-slate-700/50 border border-slate-700/20 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-600 focus:bg-slate-700/80"
							placeholder="Longitude"
							value={customLng}
							onChange={e => setCustomLng(e.target.value)}
							type="number"
							step="0.0001"
						/>
						<input className="px-2 py-2 bg-slate-700/50 border border-slate-700/20 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-600 focus:bg-slate-700/80" placeholder="Description (optional)" value={customDesc} onChange={e => setCustomDesc(e.target.value)} />
						<div className="flex gap-1">
							<button className="flex-1 py-1 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700 transition-all" onClick={addCustom}>
								Add
							</button>
							<button className="flex-1 py-1 bg-slate-700/20 text-slate-300 rounded text-xs hover:bg-slate-700/30 transition-all" onClick={() => setShowCustomForm(false)}>
								Cancel
							</button>
						</div>
					</div>
				)}

				{/* Current Route */}
				<div>
					<div className="flex items-center justify-between gap-2 mb-3">
						<div
							className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-90"
							style={{ color: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #facc15' }}
						>
							Current Route
						</div>
						<button
							type="button"
							onClick={clearAllRoute}
							disabled={manualItinerary.length === 0 && visitedIds.length === 0}
							title="Clear current route"
							className="px-3 py-2 rounded text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							style={{ border: '1px solid rgba(250,204,21,0.35)', color: '#facc15', background: 'transparent' }}
						>
							<BiTrash /> Clear All
						</button>
					</div>
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3">
						{(startPlace ? [startPlace, ...remainingItinerary] : remainingItinerary).length > 0 ? (
							(startPlace ? [startPlace, ...remainingItinerary] : remainingItinerary).map((stop, idx) => (
							<div
								key={stop.id}
								className="flex items-start gap-3 p-2 mb-2 bg-slate-700/40 last:mb-0 rounded"
								style={{ borderLeft: visitedSet.has(stop.id) ? '4px solid rgba(148,163,184,0.8)' : '4px solid #facc15' }}
							>
								<div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{backgroundColor: '#facc15', color: '#000'}}>{idx}</div>
									<div className="flex-1">
										<div
										className={
											visitedSet.has(stop.id)
												? 'text-sm font-semibold text-slate-400 cursor-pointer hover:text-yellow-400 transition-colors line-through'
												: 'text-sm font-semibold text-slate-200 cursor-pointer hover:text-yellow-400 transition-colors'
										}
											onClick={() => {
												setSelectedMarkerId(stop.id)
												try {
													if (mapRef.current && stop?.location) {
														mapRef.current.panTo({ lat: Number(stop.location.lat), lng: Number(stop.location.lng) })
														if (mapRef.current.getZoom() < 12) mapRef.current.setZoom(13)
													}
												} catch {
													// ignore
												}
											}}
										>
											{stop.name}
										</div>
										<div className="text-xs text-slate-500">
											{new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
										</div>
									{stop.id !== 'start-user-location' && (
										<label className="mt-2 flex items-center gap-2 text-xs text-slate-300 select-none">
											<input
												type="checkbox"
												checked={visitedSet.has(stop.id)}
												onChange={() => toggleVisited(stop.id)}
												className="accent-yellow-400"
											/>
											Already visited
										</label>
									)}
									</div>
									{stop.id !== 'start-user-location' && (
										<button className="text-slate-400 hover:text-red-400 transition-colors" onClick={() => removeManual(stop.id)} title="Remove">
											<BiTrash />
										</button>
									)}
								</div>
							))
						) : (
							<div className="text-center py-5 text-slate-500 text-xs">Add destinations to start planning</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2">
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3">
						<div className="text-xs uppercase text-slate-500 mb-2 tracking-wide">Distance</div>
						{result?.total_distance_km && directionsTotals.originalDistanceKm ? (
							<div>
								<div className="text-xs text-slate-400 line-through mb-1">
									{directionsTotals.originalDistanceKm} km
								</div>
								<div className="text-xl font-bold" style={{color: '#facc15'}}>
									{result.total_distance_km.toFixed(1)} km
								</div>
								<div className="text-xs mt-1" style={{color: '#86efac'}}>
									Saved {(directionsTotals.originalDistanceKm - result.total_distance_km).toFixed(1)} km
								</div>
							</div>
						) : (
							<div className="text-xl font-bold" style={{color: '#facc15'}}>
								{directionsTotals.distanceM
									? `${(directionsTotals.distanceM / 1000).toFixed(1)} km`
									: '—'}
							</div>
						)}
					</div>
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3 text-center">
						<div className="text-xs uppercase text-slate-500 mb-1 tracking-wide">Est. Time</div>
						<div className="text-xl font-bold" style={{color: '#facc15'}}>
							{directionsTotals.durationS
								? `${Math.floor(directionsTotals.durationS / 3600)}h ${Math.floor((directionsTotals.durationS % 3600) / 60)}m`
								: '—'}
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-2">
				<button className="flex-1 py-3 rounded font-semibold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all" onClick={optimize} disabled={loading || remainingItinerary.length === 0} style={{
					background: 'linear-gradient(to right, rgba(250,204,21,0.25), rgba(249,115,22,0.25))',
					border: '1px solid rgba(250,204,21,0.5)',
					color: '#facc15',
					boxShadow: '0 0 8px rgba(250,204,21,0.1)'
				}}>
					{loading ? 'Optimizing...' : 'Optimize'}
				</button>
				<button className="flex-1 py-3 rounded font-semibold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg" onClick={navActive ? stopNavigation : startNavigation} disabled={loading || activeItinerary.length < 2} style={{
					background: 'linear-gradient(to right, #facc15, #f97316)',
					color: '#000',
					boxShadow: '0 0 12px rgba(250,204,21,0.2)'
				}}>
					{navActive ? 'Stop Route' : 'Start Route'}
				</button>
			</div>

				{/* Eco Insight */}
			<div className="bg-gradient-to-b border border-green-700/30 rounded-lg p-3" style={{
				background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)',
				border: '1px solid rgba(34,197,94,0.3)'
			}}>
				<div className="text-xl mb-2"></div>
				<div className="text-xs font-semibold mb-1" style={{color: '#86efac'}}>ECO-TRAVEL INSIGHT</div>
				<div className="text-xs leading-relaxed mb-2" style={{color: '#a7f3d0'}}>{ECO_TIPS[ecoTipIndex]}</div>
				<button className="w-full py-2 rounded text-xs font-medium active:scale-95 transition-all" onClick={nextEcoTip} title="Next tip" style={{
					backgroundColor: 'rgba(34,197,94,0.2)',
					border: '1px solid rgba(34,197,94,0.4)',
					color: '#86efac'
				}}>
					More tips
				</button>
			</div>
				</div>
			)}

			{/* RIGHT MAP SECTION */}
			<div ref={rightMapSectionRef} className="flex-1 relative bg-slate-800 flex flex-col">
					{/* In-app Navigation Overlay (Google-Maps-like) */}
					{navActive && allSteps.length > 0 && (
						<>
							<div className="absolute inset-0 z-10 pointer-events-none">
								<div
									ref={navOverlayCardRef}
									className="pointer-events-auto overflow-hidden rounded-2xl"
									style={{
										position: 'absolute',
										left: navCardPos?.x ?? 16,
										top: navCardPos?.y ?? 16,
										width: 'calc(100% - 32px)',
										maxWidth: 520,
										maxHeight: 'calc(100% - 16px)',
										display: 'flex',
										flexDirection: 'column',
										background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)',
										border: '1px solid rgba(250,204,21,0.22)',
										boxShadow: '0 10px 36px rgba(0,0,0,0.55)',
									}}
								>
									<div
										className="px-4 py-3 cursor-move select-none"
										style={{ background: 'linear-gradient(to right, #facc15, #f97316)', touchAction: 'none' }}
										onPointerDown={beginDragNavCard}
										onPointerMove={onDragNavCard}
										onPointerUp={endDragNavCard}
										onPointerCancel={endDragNavCard}
									>
										<div className="flex items-center gap-3">
											<div className="text-xs font-extrabold tracking-widest" style={{ color: '#000' }}>
												STEP {currentStepIndex + 1}/{allSteps.length}
											</div>
											<div className="flex-1" />
											<button
												onClick={stopNavigation}
												className="w-9 h-9 rounded-full flex items-center justify-center"
												style={{ backgroundColor: 'rgba(0,0,0,0.12)', color: '#000' }}
												title="Stop"
											>
												<span className="text-xl leading-none">×</span>
											</button>
										</div>
									</div>

										<div className="px-4 py-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
										<div className="text-base md:text-lg font-extrabold text-slate-100 leading-snug break-words" style={{ overflowWrap: 'anywhere' }}>
											{stripHtml(currentStep?.instruction || 'Navigation')}
										</div>
										<div className="mt-2 flex items-center gap-3 text-sm">
											<div className="text-slate-300">
												<span className="text-slate-400">Dist:</span> {currentStep?.distance || '—'}
											</div>
											<div className="w-px h-4 bg-slate-700" />
											<div className="text-slate-300">
												<span className="text-slate-400">Time:</span> {currentStep?.duration || '—'}
											</div>
										</div>

										{nextStep && (
											<div className="mt-3 pt-3 border-t border-slate-700/60 text-sm text-slate-300 break-words" style={{ overflowWrap: 'anywhere' }}>
												<span className="text-slate-500">Then:</span> {stripHtml(nextStep.instruction || 'Continue')}
											</div>
										)}

										<div className="mt-4 flex gap-2">
											<button
												onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
												disabled={currentStepIndex === 0}
												className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
												style={{
													background: 'rgba(250,204,21,0.15)',
													border: '1px solid rgba(250,204,21,0.3)',
													color: '#facc15',
												}}
											>
												← Back
											</button>
											<button
												onClick={() => setCurrentStepIndex(prev => Math.min(allSteps.length - 1, prev + 1))}
												disabled={currentStepIndex === allSteps.length - 1}
												className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
												style={{
													background: 'linear-gradient(to right, #facc15, #f97316)',
													color: '#000',
													border: 'none',
												}}
											>
												Next →
											</button>
										</div>
										</div>
									</div>
								</div>

							<div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
								<div
									className="pointer-events-auto max-w-[520px] mx-auto rounded-2xl px-4 py-3"
									style={{
										background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)',
										border: '1px solid rgba(250,204,21,0.18)',
										boxShadow: '0 10px 36px rgba(0,0,0,0.45)',
									}}
								>
									<div className="flex items-center gap-4">
										<div className="w-14 h-14 rounded-full flex flex-col items-center justify-center" style={{
											backgroundColor: 'rgba(250,204,21,0.10)',
											border: '1px solid rgba(250,204,21,0.22)',
										}}>
											<div className="text-lg font-extrabold leading-none" style={{ color: '#facc15' }}>
												{Number.isFinite(userSpeedKmh) ? userSpeedKmh : 0}
											</div>
											<div className="text-[10px] text-slate-400">km/h</div>
										</div>
										<div className="flex-1 min-w-0">
											<div className="text-2xl font-extrabold text-slate-100 leading-none">{navDurationText}</div>
											<div className="text-sm text-slate-300 mt-1">
												{navDistanceText} · {navEtaText}
											</div>
										</div>
										<button
											onClick={() => setFollowUser(v => !v)}
											className="w-12 h-12 rounded-full flex items-center justify-center"
											style={{
												backgroundColor: 'rgba(250,204,21,0.10)',
												border: '1px solid rgba(250,204,21,0.22)',
												color: '#facc15',
											}}
											title={followUser ? 'Free map' : 'Follow me'}
										>
											<span className="text-lg">⌖</span>
										</button>
									</div>
								</div>
							</div>
						</>
					)}

				{/* Map Container */}
				<div className="flex-1 relative">
					{!isSidebarOpen && (
						<div className="absolute top-4 left-4 z-20">
							<button
								type="button"
								onClick={() => setIsSidebarOpen(true)}
								title="Open panel"
								className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold transition-all"
								style={{
									background: 'linear-gradient(to right, rgba(250,204,21,0.25), rgba(249,115,22,0.25))',
									border: '1px solid rgba(250,204,21,0.35)',
									color: '#facc15',
									boxShadow: '0 0 12px rgba(0,0,0,0.35)',
								}}
							>
								☰
							</button>
						</div>
					)}
					{googleMapsApiKey ? (
						<RouteOptimizerMap
							googleMapsApiKey={googleMapsApiKey}
							onMapsReady={setMapsReady}
							mapCenter={mapCenter}
							mapRef={mapRef}
							setSelectedMarkerId={setSelectedMarkerId}
							setFollowUser={setFollowUser}
							showTrafficLayer={showTrafficLayer}
							navActive={navActive}
							userAccuracyM={userAccuracyM}
								userHeadingDeg={userHeadingDeg}
							currentLocation={currentLocation}
								allDestinations={destinationData}
							activeItinerary={activeItinerary}
							selectedMarkerId={selectedMarkerId}
							showRoute={showRoute}
							directions={directions}
						/>
					) : (
						<div className="flex flex-col items-center justify-center h-full text-slate-400 p-5 text-center gap-2">
							<div className="text-base font-semibold">Missing Google Maps API Key</div>
							<div className="text-xs opacity-70">
								Add to frontend/.env:
								<br />
								VITE_GOOGLE_MAPS_API_KEY=your_key_here
							</div>
						</div>
					)}
				</div>
		</div>
	</div>
	)
}

function RouteOptimizerMap({
	googleMapsApiKey,
	onMapsReady,
	mapCenter,
	mapRef,
	setSelectedMarkerId,
	setFollowUser,
	showTrafficLayer,
	navActive,
	userAccuracyM,
	userHeadingDeg,
	currentLocation,
	allDestinations,
	activeItinerary,
	selectedMarkerId,
	showRoute,
	directions,
}) {
	const { isLoaded, loadError } = useJsApiLoader({
		id: 'ceylonroam-google-maps',
		googleMapsApiKey,
	})

	useEffect(() => {
		onMapsReady?.(Boolean(isLoaded && !loadError && window.google?.maps))
		return () => onMapsReady?.(false)
	}, [isLoaded, loadError, onMapsReady])

	const mapsAvailable = isLoaded && window.google?.maps
	const userPos = isValidLatLngLiteral(currentLocation)
		? { lat: Number(currentLocation.lat), lng: Number(currentLocation.lng) }
		: null
	const itineraryIdSet = useMemo(() => new Set((activeItinerary || []).map(s => s?.id).filter(Boolean)), [activeItinerary])
	const hasChosenStops = itineraryIdSet.size > (itineraryIdSet.has('start-user-location') ? 1 : 0)
	const showAllDestinationPins = !navActive && !hasChosenStops
	const selectedCatalogDestination = useMemo(() => {
		if (!selectedMarkerId || !Array.isArray(allDestinations)) return null
		return allDestinations.find(d => d?.id === selectedMarkerId) || null
	}, [allDestinations, selectedMarkerId])
	const allPinsIcon = window.google?.maps?.SymbolPath
		? {
			// Custom "map pin" (teardrop) shape.
			// Tip is at (0,0); body extends upward into negative Y.
			path: 'M0 0 C-8 -12 -14 -22 -14 -30 C-14 -40 -6 -48 0 -48 C6 -48 14 -40 14 -30 C14 -22 8 -12 0 0 Z',
			scale: 0.65,
			fillColor: '#facc15',
			fillOpacity: 1,
			strokeColor: '#0f172a',
			strokeOpacity: 0.95,
			strokeWeight: 2,
			anchor: new window.google.maps.Point(0, 0),
		}
		: null
	const userNavIcon = navActive && window.google?.maps?.SymbolPath
		? {
			path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
			scale: 6,
			rotation: Number.isFinite(userHeadingDeg) ? userHeadingDeg : 0,
			fillColor: '#3b82f6',
			fillOpacity: 1,
			strokeColor: '#ffffff',
			strokeOpacity: 1,
			strokeWeight: 2,
		}
		: null

	if (loadError) {
		return (
			<div className="flex flex-col items-center justify-center h-full text-red-500 p-5 text-center gap-2">
				<div className="font-semibold">Google Maps failed to initialize</div>
				<div className="text-xs opacity-80 text-red-300">
					{String(loadError?.message || loadError || '').slice(0, 220) || 'Unknown error'}
				</div>
			</div>
		)
	}
	if (!isLoaded) {
		return (
			<div className="flex items-center justify-center h-full text-slate-400">
				Loading Google Maps...
			</div>
		)
	}
	if (!mapsAvailable) {
		return (
			<div className="flex items-center justify-center h-full text-slate-400">
				Map not available
			</div>
		)
	}

	return (
		<GoogleMap
			mapContainerClassName="w-full h-full"
			center={mapCenter}
			zoom={7}
			options={{
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: true,
				backgroundColor: '#1e293b',
				restriction: {
					latLngBounds: SRI_LANKA_BOUNDS,
					strictBounds: true,
				},
				minZoom: 7,
			}}
			onLoad={map => {
				mapRef.current = map
			}}
			onClick={() => {
				setSelectedMarkerId(null)
				setFollowUser(false)
			}}
		>
			{showTrafficLayer && navActive && <TrafficLayer />}

			{/* All destination pins (on entry / planning mode) */}
			{showAllDestinationPins && Array.isArray(allDestinations) && allDestinations.map((d) => {
				if (!d?.location) return null
				if (itineraryIdSet.has(d.id)) return null
				const pos = { lat: Number(d.location.lat), lng: Number(d.location.lng) }
				if (!isValidLatLngLiteral(pos)) return null
				return (
					<MarkerF
						key={`dest-${d.id}`}
						position={pos}
						opacity={0.9}
						zIndex={10}
						icon={allPinsIcon || undefined}
						onClick={() => setSelectedMarkerId(d.id)}
					>
						{selectedMarkerId === d.id && (
							<InfoWindowF position={pos} onCloseClick={() => setSelectedMarkerId(null)}>
								<div className="text-slate-900 max-w-[220px]">
									<div className="font-bold">{d.name || 'Destination'}</div>
									{d.description ? (
										<div className="text-xs mt-1 text-slate-700">{stripHtml(d.description)}</div>
									) : null}
									<div className="text-[11px] mt-2 text-slate-600">
										{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
									</div>
							</div>
						</InfoWindowF>
						)}
					</MarkerF>
				)
			})}

			{/* Selected destination pin (so clicking from the catalog always shows its description) */}
			{!showAllDestinationPins && selectedCatalogDestination && !itineraryIdSet.has(selectedCatalogDestination.id) && (() => {
				const d = selectedCatalogDestination
				if (!d?.location) return null
				const pos = { lat: Number(d.location.lat), lng: Number(d.location.lng) }
				if (!isValidLatLngLiteral(pos)) return null
				return (
					<MarkerF
						key={`selected-dest-${d.id}`}
						position={pos}
						opacity={0.95}
						zIndex={11}
						icon={allPinsIcon || undefined}
						onClick={() => setSelectedMarkerId(d.id)}
					>
						<InfoWindowF position={pos} onCloseClick={() => setSelectedMarkerId(null)}>
							<div className="text-slate-900 max-w-[220px]">
								<div className="font-bold">{d.name || 'Destination'}</div>
								{d.description ? (
									<div className="text-xs mt-1 text-slate-700">{stripHtml(d.description)}</div>
								) : null}
								<div className="text-[11px] mt-2 text-slate-600">
									{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
								</div>
							</div>
						</InfoWindowF>
					</MarkerF>
				)
			})()}

			{userAccuracyM && userPos && (
				<CircleF
					center={userPos}
					radius={Math.min(userAccuracyM, 120)}
					options={{
						fillColor: '#3b82f6',
						fillOpacity: 0.12,
						strokeColor: '#3b82f6',
						strokeOpacity: 0.25,
						strokeWeight: 2,
					}}
				/>
			)}

			{activeItinerary.map((d, idx) => {
				if (!d?.location) return null
				const pos = { lat: Number(d.location.lat), lng: Number(d.location.lng) }
				if (!isValidLatLngLiteral(pos)) return null
				const isUser = d.id === 'start-user-location'

				return (
					<MarkerF
						key={d.id}
						position={pos}
						opacity={1}
						icon={isUser && userNavIcon ? userNavIcon : undefined}
						label={isUser ? (userNavIcon ? undefined : { text: '●', fontSize: '20px' }) : { text: String(idx), fontWeight: '800' }}
						onClick={() => setSelectedMarkerId(d.id)}
					>
						{isUser && selectedMarkerId === 'start-user-location' && (
							<InfoWindowF position={pos} onCloseClick={() => setSelectedMarkerId(null)}>
								<div className="text-slate-900">
									<div className="font-bold">Your Location</div>
									<div className="text-xs mt-1">
										{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
									</div>
								</div>
							</InfoWindowF>
						)}

						{!isUser && selectedMarkerId === d.id && (
							<InfoWindowF position={pos} onCloseClick={() => setSelectedMarkerId(null)}>
								<div className="text-slate-900 max-w-[220px]">
									<div className="font-bold">{d.name || 'Stop'}</div>
									{d.description ? (
										<div className="text-xs mt-1 text-slate-700">{stripHtml(d.description)}</div>
									) : null}
									<div className="text-[11px] mt-2 text-slate-600">
										{pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
									</div>
								</div>
							</InfoWindowF>
						)}
					</MarkerF>
				)
			})}

			{showRoute && directions && (
				<>
					{directions.routes?.[0]?.legs?.map((leg, legIdx) =>
						leg.steps?.map((step, stepIdx) => {
							const pathCoords = (step.path || []).map(p => ({ lat: p.lat(), lng: p.lng() }))
							if (pathCoords.length < 2) return null
							const color = trafficColorForLeg(leg)
							return (
								<PolylineF
									key={`${legIdx}-${stepIdx}`}
									path={pathCoords}
									options={{
										strokeColor: color,
										strokeOpacity: 0.9,
										strokeWeight: 5,
										zIndex: 5,
									}}
								/>
							)
						})
					)}
				</>
			)}
		</GoogleMap>
	)
}