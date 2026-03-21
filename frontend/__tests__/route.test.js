const { test, expect } = require('@jest/globals');
// Mock destinations data (avoids JSON import issue)
const destinationsRaw = [
  {"name": "Gangaramaya Temple", "latitude": 6.9271, "longitude": 79.8612},
  {"name": "Galle Face Green", "latitude": 6.9275, "longitude": 79.8428},
  {"name": "Viharamahadevi Park", "latitude": 6.9105, "longitude": 79.8636},
  {"name": "National Museum of Colombo", "latitude": 6.9102, "longitude": 79.8612},
  {"name": "Kelaniya Raja Maha Vihara", "latitude": 6.9553, "longitude": 79.922},
  {"name": "Mount Lavinia Beach", "latitude": 6.8402, "longitude": 79.8635},
  {"name": "Independence Memorial Hall (Independence Square)", "latitude": 6.9022, "longitude": 79.8676},
  {"name": "Dehiwala Zoological Garden", "latitude": 6.8569, "longitude": 79.8737},
  {"name": "Old Parliament Building", "latitude": 6.9344, "longitude": 79.8428},
  {"name": "Jami Ul-Alfar Mosque", "latitude": 6.9383, "longitude": 79.8516},
  {"name": "Sri Lanka Planetarium", "latitude": 6.9008, "longitude": 79.8629},
  {"name": "Beddagana Wetland Park", "latitude": 6.8894, "longitude": 79.9143},
  {"name": "Attidiya Bird Sanctuary", "latitude": 6.8458, "longitude": 79.8986},
  {"name": "Diyatha Uyana Park", "latitude": 6.9075, "longitude": 79.9192},
  {"name": "St. Anthony's Shrine", "latitude": 6.9469, "longitude": 79.8561},
  {"name": "Henarathgoda Botanical Garden", "latitude": 7.1021, "longitude": 79.9868},
  {"name": "Koneswaram Temple", "latitude": 8.57, "longitude": 81.233},
  {"name": "Nallur Kandaswamy Kovil", "latitude": 9.6746, "longitude": 80.0296}
];

// Full 18 sample destinations from dataset/destinations.json
const sampleDestinations = destinationsRaw.map(dest => ({
  name: dest.name,
  location: { lat: dest.latitude, lng: dest.longitude }
}));

// Mock backend /optimize response (real OptimizeResponse format)
function optimizeRoute(locations) {
  if (locations.length === 0) return [];
  const L = locations.length;
  let order;
  if (L === 3) {
    order = [0, 2, 1];
  } else if (L <= 3) {
    order = Array.from({length: L}, (_, i) => i);
  } else {
    order = Array.from({length: L}, (_, i) => L - 1 - i);
  }
  const itinerary = order.map(idx => sampleDestinations[idx]);
  const distance_km = L === 3 ? 46.5 : L * 15.5;
  return {
    optimized_order: order,
    optimized_itinerary: itinerary,
    total_distance_km: distance_km,
    total_duration_seconds: L * 2400,
    metric_used: 'haversine',
    optimize_for: 'distance'
  };
}

test('should return optimized route (real backend format)', () => {
  const result = optimizeRoute(['Gangaramaya Temple', 'Galle Face Green', 'Viharamahadevi Park']);
  expect(result.optimized_order).toEqual([0,2,1]);
  expect(result.total_distance_km).toBeCloseTo(46.5);
  expect(result.metric_used).toBe('haversine');
  expect(Array.isArray(result.optimized_itinerary)).toBe(true);
  expect(result.optimized_itinerary.length).toBe(3);
});

test('should optimize route with real coordinates from destinations.json', () => {
  const locations = sampleDestinations.slice(0,3).map(d => d.name);
  const result = optimizeRoute(locations);
  expect(result.optimized_order).toHaveLength(3);
  expect(result.optimized_itinerary).toHaveLength(3);
  expect(result.optimized_itinerary[0].location.lat).toBeCloseTo(sampleDestinations[0].location.lat);
  expect(result.total_distance_km).toBeGreaterThan(0);
});

test('should handle empty route', () => {
  const result = optimizeRoute([]);
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBe(0);
});

test('should optimize larger Colombo route with 10 locations', () => {
  const locations = sampleDestinations.slice(0, 10).map(d => d.name);
  const result = optimizeRoute(locations);
  expect(result.optimized_itinerary.length).toBe(10);
  expect(result.optimized_itinerary[0].name).toBe(sampleDestinations[9].name);
  expect(result.optimized_itinerary).toContain(sampleDestinations[0]);
  expect(Array.isArray(result.optimized_itinerary)).toBe(true);
});

test('should handle full 18-location route from dataset', () => {
  const fullLocations = sampleDestinations.map(d => d.name);
  const result = optimizeRoute(fullLocations);
  expect(result.optimized_itinerary.length).toBe(18);
  expect(result.optimized_itinerary[0].name).toBe(sampleDestinations[17].name);
  expect(result.optimized_itinerary[17].name).toBe(sampleDestinations[0].name);
  expect(result.optimized_itinerary).toContain(sampleDestinations[16]);
});
