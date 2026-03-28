import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceTranslation from './VoiceTranslationPage';

// Mock useTheme to avoid context issues
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false })
}));

// Mock backend URL
jest.mock('../../config/backendUrls', () => ({
  getVoiceTranslationBaseUrl: () => 'http://localhost:8000'
}));

describe('VoiceTranslationPage', () => {
  it('renders language selection and record button', () => {
    render(<VoiceTranslation />);
    expect(screen.getByText(/Step 1: Select Speaking Language/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Recording/i)).toBeInTheDocument();
  });

  it('disables record button if no language is selected', () => {
    render(<VoiceTranslation />);
    const recordBtn = screen.getByText(/Start Recording/i);
    expect(recordBtn).toBeDisabled();
  });

  it('enables record button when language is selected', () => {
    render(<VoiceTranslation />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });
    const recordBtn = screen.getByText(/Start Recording/i);
    expect(recordBtn).not.toBeDisabled();
  });

  it('shows upload input', () => {
    render(<VoiceTranslation />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it('shows transcribe button disabled if no audio', () => {
    render(<VoiceTranslation />);
    const transcribeBtn = screen.getByText(/Transcribe Audio/i);
    expect(transcribeBtn).toBeDisabled();
  });

  // Add more tests for translation and error handling as needed
});
