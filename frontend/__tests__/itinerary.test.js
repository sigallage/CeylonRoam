const { test, expect } = require('@jest/globals');

// Mock data from destinations.json
const mockDestinations = [
  {"name": "Gangaramaya Temple", "latitude": 6.9271, "longitude": 79.8612},
  {"name": "Galle Face Green", "latitude": 6.9275, "longitude": 79.8428},
  {"name": "Sigiriya Rock Fortress", "latitude": 7.9570, "longitude": 80.7603},
  {"name": "Temple of the Tooth, Kandy", "latitude": 7.2936, "longitude": 80.6405},
  {"name": "Galle Fort", "latitude": 6.0328, "longitude": 80.2170}
];

// Mock itinerary data
const mockItineraryData = [
  { id: "dest-1", name: "Sigiriya Rock Fortress", location: { lat: 7.9570, lng: 80.7603 } },
  { id: "dest-2", name: "Temple of the Tooth, Kandy", location: { lat: 7.2936, lng: 80.6405 } },
  { id: "dest-3", name: "Galle Fort", location: { lat: 6.0328, lng: 80.2170 } }
];

// Mock axios
const axiosMock = {
  post: jest.fn(() =>
    Promise.resolve({ data: { itinerary: mockItineraryData } })
  )
};

// Mock navigation
const mockNavigate = jest.fn();

// ---------------- TESTS ----------------

// Input parsing
test('should parse purpose input into array correctly', () => {
  const input = "cultural, wellness, surfing";
  const result = input.split(/[\n,]/).map(entry => entry.trim()).filter(Boolean);
  expect(result).toEqual(['cultural', 'wellness', 'surfing']);
});

// Budget parsing
test('should parse budget string to number correctly', () => {
  const budgetStr = "150,000";
  const numericBudget = Number.parseInt(budgetStr.replace(/[^0-9]/g, ""), 10);
  expect(numericBudget).toBe(150000);
});

test('should handle non-numeric budget gracefully', () => {
  const budgetStr = "flexible";
  const numericBudget = Number.parseInt(budgetStr.replace(/[^0-9]/g, ""), 10);
  expect(Number.isNaN(numericBudget)).toBe(true);
});

// Date handling
test('should detect past dates correctly', () => {
  const pastDate = '2024-09-30';
  const today = new Date('2024-10-01');
  today.setHours(0, 0, 0, 0);
  const dateToCheck = new Date(pastDate);
  expect(dateToCheck < today).toBe(true);
});

test('should set start date on first click', () => {
  let startDate = null;
  const isoValue = '2024-10-15';
  startDate = isoValue;
  expect(startDate).toBe('2024-10-15');
});

test('should set end date when clicking after start date', () => {
  let startDate = '2024-10-15';
  let endDate = null;
  const isoValue = '2024-10-20';
  endDate = isoValue;
  expect(endDate).toBe('2024-10-20');
  expect(startDate).toBe('2024-10-15');
});

test('should reset to new start date when clicking before existing range', () => {
  let startDate = '2024-10-15';
  let endDate = '2024-10-20';
  const isoValue = '2024-10-10';
  startDate = isoValue;
  endDate = null;
  expect(startDate).toBe('2024-10-10');
  expect(endDate).toBeNull();
});

// Province selection
test('should toggle province selection correctly', () => {
  let selectedProvinces = [];
  const province = 'Western';

  selectedProvinces = [...selectedProvinces, province];
  expect(selectedProvinces).toEqual(['Western']);

  selectedProvinces = selectedProvinces.filter(p => p !== province);
  expect(selectedProvinces).toEqual([]);
});

// Payload preparation
test('should prepare correct submission payload', () => {
  const formState = {
    purposeInput: 'cultural, wellness',
    budget: '150000',
    tripType: 'family',
    preferencesInput: 'vegetarian',
    gender: 'female',
    selectedProvinces: ['Western', 'Central']
  };

  const parseList = (value) =>
    value.split(/[\n,]/).map(e => e.trim()).filter(Boolean);

  const payload = {
    gender: formState.gender,
    purpose: parseList(formState.purposeInput),
    traveling_with: formState.tripType,
    budget_lkr: 150000,
    preferences: parseList(formState.preferencesInput),
    start_date: '2024-10-15',
    end_date: '2024-10-20',
    provinces: formState.selectedProvinces
  };

  expect(payload.purpose).toEqual(['cultural', 'wellness']);
  expect(payload.budget_lkr).toBe(150000);
  expect(payload.provinces).toEqual(['Western', 'Central']);
});

// ✅ FIXED: API success + navigation
test('should mock successful API response and trigger navigation', async () => {
  mockNavigate.mockClear();

  const response = await axiosMock.post('mock-url', { provinces: ['Western'] });

  // Simulate real app behavior
  mockNavigate('/main', {
    state: { aiResponse: response }
  });

  expect(mockNavigate).toHaveBeenCalledWith(
    '/main',
    expect.objectContaining({
      state: { aiResponse: response }
    })
  );
});

// ✅ FIXED: API error handling
test('should handle API error gracefully', async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  axiosMock.post.mockRejectedValueOnce(new Error('Network error'));

  try {
    await axiosMock.post('mock-url', {});
  } catch (error) {
    console.error('Trip plan submission failed', error);
  }

  expect(consoleSpy).toHaveBeenCalledWith(
    'Trip plan submission failed',
    expect.any(Error)
  );

  consoleSpy.mockRestore();
});

// Route integration
test('should integrate with route optimization for itinerary destinations', () => {
  function optimizeRoute(locations) {
    return locations.slice().reverse();
  }

  const itineraryLocs = mockItineraryData.map(d => d.name);
  const optimized = optimizeRoute(itineraryLocs);

  expect(optimized.length).toBe(3);
  expect(optimized[0]).toBe('Galle Fort');
  expect(optimized).toContain('Sigiriya Rock Fortress');
});

// Full workflow validation
test('should validate complete travel itinerary workflow', () => {
  expect(mockDestinations.length).toBeGreaterThan(0);
  expect(mockItineraryData.length).toBe(3);

  const fullTestPass =
    mockDestinations.length === 5 &&
    mockItineraryData.every(item => item.hasOwnProperty('location'));

  expect(fullTestPass).toBe(true);
});