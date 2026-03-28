import { render, screen, fireEvent } from '@testing-library/react';
import VoiceTranslation from './VoiceTranslationPage';

// The Mock useTheme is added to avoid context issues in tests
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false })
}));

// Mock backend URL is there to prevent actual network calls
jest.mock('../../config/backendUrls', () => ({
  getVoiceTranslationBaseUrl: () => 'http://localhost:8000'
}));

// The Test suite is there for the VoiceTranslationPage component
describe('VoiceTranslationPage', () => {
  // Test that the language selection and record button render
  it('renders language selection and record button', () => {
    render(<VoiceTranslation />);
    expect(screen.getByText(/Step 1: Select Speaking Language/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Recording/i)).toBeInTheDocument();
  });

  // Here below shows the Test that the record button is disabled if no language is selected
  it('disables record button if no language is selected', () => {
    render(<VoiceTranslation />);
    const recordBtn = screen.getByText(/Start Recording/i);
    expect(recordBtn).toBeDisabled();
  });

  // The Test that the record button is enabled when a language is selected
  it('enables record button when language is selected', () => {
    render(<VoiceTranslation />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });
    const recordBtn = screen.getByText(/Start Recording/i);
    expect(recordBtn).not.toBeDisabled();
  });

  // This shows the Test that the upload input for audio files is present
  it('shows upload input', () => {
    render(<VoiceTranslation />);
    // Directly query the file input since it has no associated label
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  // This shows the Test that the transcribe button is disabled if there is no audio
  it('shows transcribe button disabled if no audio', () => {
    render(<VoiceTranslation />);
    const transcribeBtn = screen.getByText(/Transcribe Audio/i);
    expect(transcribeBtn).toBeDisabled();
  });
  
//This file is for the unit testing for voice translation feature.
});
