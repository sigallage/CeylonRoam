import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('react-icons/fi', () => ({
  FiX: () => null,
  FiTrash2: () => null,
  FiCalendar: () => null,
  FiMapPin: () => null,
}));

jest.mock('../../src/config/backendUrls', () => ({
  getAuthBaseUrl: () => 'http://auth.example',
}));

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: true }),
}));

import Main from '../../src/pages/Main/Main';

const renderWithState = (state) => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/main', state }]}>
      <Routes>
        <Route path="/main" element={<Main />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Main itinerary saving', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('posts to /api/itineraries when Save Itinerary clicked', async () => {
    window.localStorage.setItem('ceylonroam_user', JSON.stringify({ token: 't123' }));

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ status: 'success' }),
    });

    const aiResponse = {
      summary: 's',
      itinerary: 'Day 1: ...',
      generated_at: new Date().toISOString(),
      metadata: {
        date_range: {
          start: '2026-03-01T00:00:00.000Z',
          end: '2026-03-03T00:00:00.000Z',
          label: 'Mar 1 - Mar 3',
        },
        provinces: ['Central'],
        budget_label: '5000',
        preferences: ['Nature'],
      },
    };

    renderWithState({ aiResponse });

    fireEvent.click(screen.getByRole('button', { name: /save itinerary/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('http://auth.example/api/itineraries');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer t123');
    expect(options.headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.title).toContain('Central');
    expect(body.itineraryData.summary).toBe('s');
  });

  it('shows login error instead of throwing when token missing', async () => {
    const aiResponse = {
      summary: 's',
      itinerary: 'i',
      generated_at: new Date().toISOString(),
      metadata: { date_range: { start: '2026-03-01T00:00:00.000Z', end: '2026-03-01T00:00:00.000Z' } },
    };

    renderWithState({ aiResponse });

    fireEvent.click(screen.getByRole('button', { name: /save itinerary/i }));

    expect(await screen.findByText(/please log in/i)).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
