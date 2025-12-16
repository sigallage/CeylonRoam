const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const optimizeRoute = async (destinations, userLocation = null, useTraffic = true, trafficModel = 'best_guess') => {
  try {
    // If user location is provided, prepend it as the starting point
    let destinationsToOptimize = [...destinations];
    
    if (userLocation) {
      // Add user's current location as the first destination
      destinationsToOptimize = [
        {
          id: 'user-location',
          name: 'Your Location',
          location: { lat: userLocation.lat, lng: userLocation.lng },
          description: 'Starting point'
        },
        ...destinations
      ];
    }

    const response = await fetch(`${API_BASE_URL}/api/optimize-route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destinations: destinationsToOptimize,
        optimize: true,
        use_traffic: useTraffic,
        traffic_model: trafficModel
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling optimize route API:', error);
    throw error;
  }
};
