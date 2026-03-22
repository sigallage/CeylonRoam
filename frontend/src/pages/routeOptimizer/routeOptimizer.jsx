import { useEffect, useMemo, useRef, useState } from 'react'
import { getRouteOptimizerBaseUrl } from '../../config/backendUrls'
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

import { mockItinerary } from '../../mockData/itineraryData.js'
import destinationsRaw from '../../dataset/destinations.json'

// Transform destinations.json format
const destinationData = destinationsRaw.map(dest => ({
	id: dest.id || dest.name,
	name: dest.name,
	location: { lat: dest.latitude, lng: dest.longitude },
	description: dest.description || '',
}))

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 }

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

export default function RouteOptimizer() {
	const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
	const { isLoaded, loadError } = useJsApiLoader({
		id: 'ceylonroam-google-maps',
		googleMapsApiKey: googleMapsApiKey || 'AIzaSyDummyKeyForTesting',
	})

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
	const [directions, setDirections] = useState(null)
	const [directionsTotals, setDirectionsTotals] = useState({ durationS: null, distanceM: null, originalDistanceKm: null })
	const [customName, setCustomName] = useState('')
	const [customLat, setCustomLat] = useState('')
	const [customLng, setCustomLng] = useState('')
	const [customDesc, setCustomDesc] = useState('')
	const [showCustomForm, setShowCustomForm] = useState(false)
	const [visitedIds, setVisitedIds] = useState([])
	const [navTick, setNavTick] = useState(0)
	const [userAccuracyM, setUserAccuracyM] = useState(null)
	const [ecoTipIndex, setEcoTipIndex] = useState(0)
	const [currentStepIndex, setCurrentStepIndex] = useState(0)

	const mapRef = useRef(null)
	const locationRequestedRef = useRef(false)

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
			},
			(err) => {
				setLocationError('Enable location permissions to use this feature')
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
		)
	}, [])

	// Update directions
	useEffect(() => {
		if (!isLoaded || !googleMapsApiKey || !window.google?.maps) return
		if (manualItinerary.length < 1) {
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
			},
			(result, status) => {
				if (status === 'OK' && result) {
					setDirections(result)
					const legs = result.routes?.[0]?.legs || []
					let totalDuration = 0
					let totalDistance = 0
					for (const leg of legs) {
						totalDuration += leg?.duration?.value || 0
						totalDistance += leg?.distance?.value || 0
					}
					setDirectionsTotals({ durationS: totalDuration, distanceM: totalDistance })
				} else {
					setDirections(null)
				}
			}
		)
	}, [isLoaded, googleMapsApiKey, manualItinerary, returnToStart, travelMode, currentLocation, navActive])

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

	const remainingItinerary = manualItinerary.filter(d => !visitedSet.has(d.id))

	const activeItinerary = startPlace && remainingItinerary.length > 0
		? [startPlace, ...remainingItinerary]
		: remainingItinerary

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
	}

	function removeManual(id) {
		setManualItinerary(manualItinerary.filter(d => d.id !== id))
		setResult(null)
	}

	async function optimize() {
		setError('')
		setLoading(true)
		try {
			const url = getRouteOptimizerBaseUrl() || '/api'
			const basePath = url.endsWith('/api') ? url : `${url}/api`

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
			
			// Apply optimized itinerary order if available
			if (json.optimized_itinerary && Array.isArray(json.optimized_itinerary)) {
				setManualItinerary(json.optimized_itinerary)
			}
		} catch (e) {
			setError(e?.message || 'Optimization failed')
		} finally {
			setLoading(false)
		}
	}

	function startNavigation() {
		if (!googleMapsApiKey) {
			setError('Missing Google Maps API key. Add VITE_GOOGLE_MAPS_API_KEY to .env.development')
			return
		}
		setShowTrafficLayer(true)
		setNavActive(true)
		setCurrentStepIndex(0)
	}

	function stopNavigation() {
		setNavActive(false)
		setFollowUser(true)
	}

	function nextEcoTip() {
		setEcoTipIndex((prev) => (prev + 1) % ECO_TIPS.length)
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

	const mapsAvailable = isLoaded && window.google?.maps
	const showRoute = activeItinerary.length >= 2

	return (
		<div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden" style={{
			background: 'linear-gradient(135deg, rgba(15,23,42,1) 0%, rgba(15,23,42,0.95) 100%)',
			boxShadow: 'inset 0 0 0 1px rgba(250,204,21,0.1)'
		}}>
			{/* LEFT SIDEBAR */}
			<div className="w-[350px] bg-gradient-to-b from-slate-800 to-slate-950 border-r border-slate-700/20 overflow-y-auto p-5 flex flex-col gap-5" style={{
				borderRight: '1px solid rgba(250,204,21,0.2)'
			}}>
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
						<button className="flex-1 px-3 py-2 border border-slate-700/20 bg-slate-700/50 text-slate-300 rounded text-xs font-semibold hover:border-yellow-400 hover:bg-slate-700/80 transition-all">Generate</button>
					</div>
				</div>

				{/* Available Destinations */}
				<div>
				<div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest opacity-90" style={{color: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #facc15'}}>Available Destinations</div>
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3 max-h-48 overflow-y-auto">
						{destinationData.map(d => (
							<div key={d.id} className="flex items-center justify-between py-2 px-2 border-b border-slate-700/10 last:border-b-0 text-sm">
								<span className="flex-1 text-slate-200 hover:text-yellow-400 cursor-pointer transition-colors">{d.name}</span>
								<button className="px-2 py-1 rounded text-xs transition-all flex items-center gap-1" onClick={() => addFromCatalog(d.id)} title="Add to route" style={{border: '1px solid #f97316', color: '#f97316', background: 'transparent'}}>
									<FiPlus size={14} /> Add
								</button>
							</div>
						))}
					</div>
				<button className="w-full mt-2 py-2 bg-transparent rounded text-xs transition-all flex items-center justify-center gap-1" onClick={() => setShowCustomForm(!showCustomForm)}
					style={{
						border: '1px dashed #facc15',
						color: '#facc15'
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
					<div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-widest opacity-90" style={{color: '#facc15', backgroundColor: 'rgba(250,204,21,0.1)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #facc15'}}>Current Route</div>
					<div className="bg-slate-800/60 border border-slate-700/20 rounded-lg p-3">
						{activeItinerary.length > 0 ? (
							activeItinerary.map((stop, idx) => (
							<div key={stop.id} className="flex items-start gap-3 p-2 mb-2 bg-slate-700/40 last:mb-0 rounded" style={{borderLeft: '4px solid #facc15'}}>
								<div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{backgroundColor: '#facc15', color: '#000'}}>{idx}</div>
									<div className="flex-1">
										<div className="text-sm font-semibold text-slate-200">{stop.name}</div>
										<div className="text-xs text-slate-500">
											{new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
										</div>
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
									✓ Saved {(directionsTotals.originalDistanceKm - result.total_distance_km).toFixed(1)} km
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
					{loading ? '⟳ Optimizing' : 'Optimize'}
				</button>
				<button className="flex-1 py-3 rounded font-semibold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg" onClick={navActive ? stopNavigation : startNavigation} disabled={loading || activeItinerary.length < 2} style={{
					background: 'linear-gradient(to right, #facc15, #f97316)',
					color: '#000',
					boxShadow: '0 0 12px rgba(250,204,21,0.2)'
				}}>
					{navActive ? '⊘ Stop Route' : '▶ Start Route'}
				</button>
			</div>

				{/* Eco Insight */}
			<div className="bg-gradient-to-b border border-green-700/30 rounded-lg p-3" style={{
				background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)',
				border: '1px solid rgba(34,197,94,0.3)'
			}}>
				<div className="text-xl mb-2">🌿</div>
				<div className="text-xs font-semibold mb-1" style={{color: '#86efac'}}>ECO-TRAVEL INSIGHT</div>
				<div className="text-xs leading-relaxed mb-2" style={{color: '#a7f3d0'}}>{ECO_TIPS[ecoTipIndex]}</div>
				<button className="w-full py-2 rounded text-xs font-medium active:scale-95 transition-all" onClick={nextEcoTip} title="Next tip" style={{
					backgroundColor: 'rgba(34,197,94,0.2)',
					border: '1px solid rgba(34,197,94,0.4)',
					color: '#86efac'
				}}>
						💡 More tips
					</button>
				</div>
			</div>

			{/* RIGHT MAP SECTION */}
			<div className="flex-1 relative bg-slate-800 flex flex-col">
				{/* Google Maps Style Navigation Card */}
				{navActive && allSteps.length > 0 && (
					<div className="absolute top-4 left-4 right-4 z-10" style={{
						maxWidth: '280px'
					}}>
						<div className="bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-700" style={{
							background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.95) 100%)',
							border: '1px solid rgba(250,204,21,0.2)',
							boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
						}}>
							{/* Step Counter */}
							<div className="text-xs font-semibold mb-2" style={{color: '#facc15'}}>
								STEP {currentStepIndex + 1}/{allSteps.length}
							</div>

							{/* Main Instruction */}
							<div className="flex items-start gap-3 mb-3">
								<div className="text-2xl">🧭</div>
								<div className="flex-1">
									<div className="text-sm font-bold text-slate-200" dangerouslySetInnerHTML={{__html: currentStep?.instruction || 'Navigation'}} />
								</div>
							</div>

							{/* Distance and Duration */}
							<div className="flex items-center gap-3 mb-3 bg-slate-800/40 rounded-lg p-2">
								<div>
									<div className="text-xs text-slate-400">Distance</div>
									<div className="text-lg font-bold" style={{color: '#facc15'}}>
										{currentStep?.distance || '—'}
									</div>
								</div>
								<div className="w-px h-8 bg-slate-700"></div>
								<div>
									<div className="text-xs text-slate-400">Time</div>
									<div className="text-lg font-bold" style={{color: '#facc15'}}>
										{currentStep?.duration || '—'}
									</div>
								</div>
							</div>

							{/* Next Step Preview */}
							{currentStepIndex < allSteps.length - 1 && (
								<div className="mb-3 text-xs text-slate-400 border-t border-slate-700 pt-2">
									<div className="text-slate-500 mb-1">Then</div>
									<div className="text-slate-300 line-clamp-2">
										{allSteps[currentStepIndex + 1]?.instruction ? (
											<span dangerouslySetInnerHTML={{__html: allSteps[currentStepIndex + 1].instruction}} />
										) : (
											'Continue'
										)}
									</div>
								</div>
							)}

							{/* Navigation Buttons */}
							<div className="flex gap-2 mt-3">
								<button 
									onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
									disabled={currentStepIndex === 0}
									className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
									style={{
										background: 'rgba(250,204,21,0.15)',
										border: '1px solid rgba(250,204,21,0.3)',
										color: '#facc15'
									}}>
									← Back
								</button>
								<button 
									onClick={() => setCurrentStepIndex(prev => Math.min(allSteps.length - 1, prev + 1))}
									disabled={currentStepIndex === allSteps.length - 1}
									className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
									style={{
										background: 'linear-gradient(to right, #facc15, #f97316)',
										color: '#000',
										border: 'none'
									}}>
									Next →
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Map Container */}
				<div className="flex-1 relative">
				{!googleMapsApiKey ? (
					<div className="flex flex-col items-center justify-center h-full text-slate-400 p-5 text-center gap-2">
						<div className="text-base font-semibold">Missing Google Maps API Key</div>
						<div className="text-xs opacity-70">
							Add to frontend/.env.development:
							<br />
							VITE_GOOGLE_MAPS_API_KEY=your_key_here
						</div>
					</div>
				) : loadError ? (
					<div className="flex items-center justify-center h-full text-red-500">
						Google Maps failed to initialize
					</div>
				) : !isLoaded ? (
					<div className="flex items-center justify-center h-full text-slate-400">
						Loading Google Maps…
					</div>
				) : !mapsAvailable ? (
					<div className="flex items-center justify-center h-full text-slate-400">
						Map not available
					</div>
				) : (
					<GoogleMap
						mapContainerClassName="w-full h-full"
						center={mapCenter}
						zoom={8}
						options={{
							mapTypeControl: false,
							streetViewControl: false,
							fullscreenControl: true,
							backgroundColor: '#1e293b',
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

						{userAccuracyM && currentLocation && (
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
									label={isUser ? { text: '●', fontSize: '20px' } : { text: String(idx), fontWeight: '800' }}
									onClick={() => setSelectedMarkerId(d.id)}
								/>
							)
						})}

						{selectedMarkerId === 'start-user-location' && isValidLatLngLiteral(currentLocation) && (
							<InfoWindowF position={currentLocation} onCloseClick={() => setSelectedMarkerId(null)}>
								<div className="text-slate-900">
									<div className="font-bold">Your Location</div>
									<div className="text-xs mt-1">
										{currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
									</div>
								</div>
							</InfoWindowF>
						)}

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
				)}
			</div>
		</div>
	</div>
	)
}