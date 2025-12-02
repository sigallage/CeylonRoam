import { useState } from 'react'
import MapComponent from './components/MapComponent'
import { mockItinerary } from './data/mockData'
import { optimizeRoute } from './services/api'
import './App.css'

function App() {
  const [destinations] = useState(mockItinerary)
  const [optimizedRoute, setOptimizedRoute] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [useTraffic, setUseTraffic] = useState(true)
  const [trafficModel, setTrafficModel] = useState('best_guess')

  const handleOptimizeRoute = async (userLoc) => {
    try {
      const result = await optimizeRoute(destinations, userLoc, useTraffic, trafficModel)
      setOptimizedRoute(result)
    } catch (error) {
      console.error('Failed to optimize route:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🇱🇰 Ceylon Voyage - Route Planner
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Plan your perfect journey through Sri Lanka
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Itinerary Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Your Itinerary
              </h2>
              <div className="space-y-3">
                {destinations.map((dest, index) => (
                  <div
                    key={dest.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {dest.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {dest.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {optimizedRoute && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">
                    ✓ Route Optimized
                  </h3>
                  <div className="text-xs text-green-800 space-y-1">
                    <p>Distance: {optimizedRoute.total_distance}</p>
                    <p>Duration: {optimizedRoute.total_duration}</p>
                    {useTraffic && (
                      <p className="text-xs text-green-700 italic mt-1">
                        🚦 Including live traffic data
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Traffic Settings Panel */}
            <div className="mt-4 bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                🚦 Traffic Settings
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Use Live Traffic
                  </label>
                  <button
                    onClick={() => setUseTraffic(!useTraffic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      useTraffic ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useTraffic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {useTraffic && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-2 block">
                      Traffic Model
                    </label>
                    <select
                      value={trafficModel}
                      onChange={(e) => setTrafficModel(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="best_guess">Best Guess (Recommended)</option>
                      <option value="optimistic">Optimistic</option>
                      <option value="pessimistic">Pessimistic</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {trafficModel === 'best_guess' && 'Most accurate based on current traffic'}
                      {trafficModel === 'optimistic' && 'Assumes lighter than usual traffic'}
                      {trafficModel === 'pessimistic' && 'Assumes heavier than usual traffic'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                ℹ️ Instructions
              </h3>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Map shows only your itinerary destinations</li>
                <li>Click markers for destination details</li>
                <li>Click "Optimize Route" for the best path</li>
                <li>Route is displayed with connecting lines</li>
              </ul>
            </div>
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ height: '700px' }}>
              <MapComponent
                destinations={destinations}
                optimizedRoute={optimizedRoute}
                onOptimizeRoute={handleOptimizeRoute}
                userLocation={userLocation}
                onUserLocationChange={setUserLocation}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
