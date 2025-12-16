import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const MapComponent = ({ 
  destinations = [], 
  optimizedRoute = null,
  onOptimizeRoute,
  userLocation,
  onUserLocationChange
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const userLocationMarkerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localUserLocation, setLocalUserLocation] = useState(userLocation);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (googleMapRef.current && destinations.length > 0) {
      updateMarkers();
    }
  }, [destinations]);

  useEffect(() => {
    if (googleMapRef.current && optimizedRoute) {
      displayOptimizedRoute();
    }
  }, [optimizedRoute]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Center on Sri Lanka
    const mapOptions = {
      center: { lat: 7.8731, lng: 80.7718 },
      zoom: 8,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    };

    googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    
    // Initialize DirectionsRenderer for route display
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: googleMapRef.current,
      suppressMarkers: true, // we'll render our own markers
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    if (destinations.length > 0) {
      updateMarkers();
    }

    // Get user's location
    getUserLocation();
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setLocalUserLocation(userPos);
        if (onUserLocationChange) {
          onUserLocationChange(userPos);
        }
        setLocationError(null);

        // Add user location marker if map is loaded
        if (googleMapRef.current) {
          addUserLocationMarker(userPos);
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  const addUserLocationMarker = (position) => {
    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
    }

    // Create new user location marker
    const marker = new window.google.maps.Marker({
      position,
      map: googleMapRef.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      zIndex: 1000
    });

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #10B981;">📍 Your Current Location</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(googleMapRef.current, marker);
    });

    userLocationMarkerRef.current = marker;

    // Add accuracy circle
    new window.google.maps.Circle({
      map: googleMapRef.current,
      center: position,
      radius: 100, // meters
      fillColor: '#10B981',
      fillOpacity: 0.1,
      strokeColor: '#10B981',
      strokeOpacity: 0.3,
      strokeWeight: 1,
    });
  };

  const handleLocateMe = () => {
    if (userLocation && googleMapRef.current) {
      googleMapRef.current.panTo(userLocation);
      googleMapRef.current.setZoom(15);
    } else {
      getUserLocation();
    }
  };

  const updateMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (!googleMapRef.current || destinations.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    // Add markers for itinerary destinations only
    destinations.forEach((dest, index) => {
      const position = { lat: dest.location.lat, lng: dest.location.lng };
      
      const marker = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: dest.name,
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#4F46E5',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${dest.name}</h3>
            <p style="margin: 0; font-size: 14px; color: #666;">${dest.description || ''}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (destinations.length > 0) {
      googleMapRef.current.fitBounds(bounds);
    }
  };

  const displayOptimizedRoute = () => {
    if (!googleMapRef.current || !optimizedRoute || !directionsRendererRef.current) return;

    // Clear previous route
    directionsRendererRef.current.setMap(null);
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: googleMapRef.current,
      suppressMarkers: true, // custom markers for all stops including start
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    // Build list of all destinations including user location (always prepend if available)
    const allDestinations = [];
    const currentUserPos = localUserLocation || userLocation;

    if (currentUserPos) {
      allDestinations.push({
        id: 'user-location',
        name: 'Your Location',
        location: currentUserPos
      });
    }

    // Add itinerary destinations according to optimized order (skip duplicate user-location)
    optimizedRoute.optimized_order.forEach(id => {
      if (id === 'user-location') return;
      const dest = destinations.find(d => d.id === id);
      if (dest) allDestinations.push(dest);
    });

    if (allDestinations.length < 2) return;

    // Clear old markers (itinerary and user location dot) before drawing route markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
      userLocationMarkerRef.current = null;
    }

    const directionsService = new window.google.maps.DirectionsService();
    
    const origin = allDestinations[0].location;
    const destination = allDestinations[allDestinations.length - 1].location;
    const waypoints = allDestinations.slice(1, -1).map(dest => ({
      location: { lat: dest.location.lat, lng: dest.location.lng },
      stopover: true
    }));

    const request = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints: waypoints,
      optimizeWaypoints: false, // Already optimized by backend
      travelMode: window.google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(result);
        addRouteMarkers(allDestinations);
        fitBoundsTo(allDestinations);
      } else {
        console.error('Directions request failed:', status);
        // Draw simple polylines as fallback
        drawSimpleRoute(allDestinations);
        addRouteMarkers(allDestinations);
        fitBoundsTo(allDestinations);
      }
    });
  };

  const addRouteMarkers = (orderedDestinations) => {
    orderedDestinations.forEach((dest, idx) => {
      const position = { lat: dest.location.lat, lng: dest.location.lng };
      const isStart = idx === 0;
      const isEnd = idx === orderedDestinations.length - 1;

      const marker = new window.google.maps.Marker({
        position,
        map: googleMapRef.current,
        title: `${isStart ? 'Start - ' : ''}${dest.name || 'Stop'}${isEnd ? ' (End)' : ''}`,
        label: {
          text: `${idx + 1}`,
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: isStart ? '#10B981' : '#4F46E5', // green for start, indigo others
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        zIndex: isStart ? 1001 : (isEnd ? 1000 : 999)
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 220px;">
            <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600;">${isStart ? 'Start: ' : ''}${dest.name || 'Stop'}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">Lat: ${position.lat.toFixed(6)}, Lng: ${position.lng.toFixed(6)}</p>
          </div>
        `
      });
      marker.addListener('click', () => infoWindow.open(googleMapRef.current, marker));
      markersRef.current.push(marker);
    });
  };

  const fitBoundsTo = (stops) => {
    const bounds = new window.google.maps.LatLngBounds();
    stops.forEach(s => bounds.extend({ lat: s.location.lat, lng: s.location.lng }));
    googleMapRef.current.fitBounds(bounds);
  };

  const drawSimpleRoute = (orderedDestinations) => {
    const routePath = orderedDestinations.map(dest => ({
      lat: dest.location.lat,
      lng: dest.location.lng
    }));

    new window.google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#4F46E5',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: googleMapRef.current
    });
  };

  const handleOptimizeClick = async () => {
    if (destinations.length < 2) {
      alert('At least 2 destinations are required to optimize the route');
      return;
    }

    const currentUserPos = localUserLocation || userLocation;
    if (!currentUserPos) {
      const proceed = confirm('Your live location is not available yet. Optimize without using it as the starting point?');
      if (!proceed) return;
    }

    setIsLoading(true);
    try {
      await onOptimizeRoute(currentUserPos);
    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Failed to optimize route. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Route Map</h2>
          <p className="text-sm text-gray-600">
            {destinations.length} destination{destinations.length !== 1 ? 's' : ''} in itinerary
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLocateMe}
            className="px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            title="Show my location"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Locate Me
          </button>
          <button
            onClick={handleOptimizeClick}
            disabled={isLoading || destinations.length < 2}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Optimizing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Optimize Route
              </>
            )}
          </button>
        </div>
      </div>

      {locationError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-800">⚠️ {locationError}</p>
        </div>
      )}

      {userLocation && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2">
          <p className="text-sm text-green-800">
            ✓ Your location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)} (used as starting point)
          </p>
        </div>
      )}
      
      {optimizedRoute && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-indigo-900">Total Distance:</span>
              <span className="text-indigo-700">{optimizedRoute.total_distance}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-indigo-900">Total Duration:</span>
              <span className="text-indigo-700">{optimizedRoute.total_duration}</span>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="flex-1 w-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};

MapComponent.propTypes = {
  destinations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired
    }).isRequired,
    description: PropTypes.string
  })),
  optimizedRoute: PropTypes.shape({
    optimized_order: PropTypes.arrayOf(PropTypes.string).isRequired,
    total_distance: PropTypes.string.isRequired,
    total_duration: PropTypes.string.isRequired,
    routes: PropTypes.array
  }),
  onOptimizeRoute: PropTypes.func.isRequired,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  onUserLocationChange: PropTypes.func
};

export default MapComponent;
