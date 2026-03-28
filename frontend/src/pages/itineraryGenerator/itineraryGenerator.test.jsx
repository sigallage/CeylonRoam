import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ItineraryGenerator from './itineraryGenerator';

// Mock useTheme to avoid context issues
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false })
}));

// Mock backend URL
jest.mock('../../config/backendUrls', () => ({
  getItineraryApiBaseUrl: () => 'http://localhost:8000'
}));

describe('ItineraryGenerator', () => {
  it('renders form fields', () => {
    render(
      <MemoryRouter>
        <ItineraryGenerator />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Purpose of trip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Budget in LKR/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Solo or family/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Additional preferences/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Selected travel dates/i)).toBeInTheDocument();
  });

  it('allows input in purpose and budget fields', () => {
    render(
      <MemoryRouter>
        <ItineraryGenerator />
      </MemoryRouter>
    );
    const purposeInput = screen.getByLabelText(/Purpose of trip/i);
    const budgetInput = screen.getByLabelText(/Budget in LKR/i);
    fireEvent.change(purposeInput, { target: { value: 'surfing' } });
    fireEvent.change(budgetInput, { target: { value: '100000' } });
    expect(purposeInput.value).toBe('surfing');
    expect(budgetInput.value).toBe('100000');
  });


  it('shows province dropdown when clicked', () => {
    render(
      <MemoryRouter>
        <ItineraryGenerator />
      </MemoryRouter>
    );
    const provinceBtn = screen.getByText(/Select provinces/i);
    fireEvent.click(provinceBtn);
    // There are multiple matches for 'Western', so use getAllByText and check at least one is present
    const westernOptions = screen.getAllByText(/Western/i);
    expect(westernOptions.length).toBeGreaterThan(0);
    expect(westernOptions[0]).toBeInTheDocument();
  });


  it('disables submit button when submitting', () => {
    render(
      <MemoryRouter>
        <ItineraryGenerator />
      </MemoryRouter>
    );
    // Use getByRole to select the button only
    const submitBtn = screen.getByRole('button', { name: /Enter/i });
    fireEvent.click(submitBtn);
    expect(submitBtn).toBeDisabled();
  });

  // This file is for the unit testing for itinerary generator feature.
});
