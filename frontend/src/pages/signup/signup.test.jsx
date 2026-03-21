import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SignUp from './signup';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
}));

jest.mock('../../config/backendUrls', () => ({
  getAuthBaseUrl: () => 'http://localhost:5001',
}));

describe('SignUp page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.alert = jest.fn();
  });

  it('renders signup form controls', () => {
    render(<SignUp />);

    expect(screen.getByRole('heading', { name: 'Create Your Account' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('shows validation errors for invalid submission', async () => {
    render(<SignUp />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'valid@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '456' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign Up' }).closest('form'));

    expect(await screen.findByText('Password must be at least 6 characters')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    expect(screen.getByText('Please accept the terms and conditions')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits successfully and navigates to login', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'ok' }),
    });

    render(<SignUp />);

    fireEvent.change(screen.getByLabelText('Full Name (optional)'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/signup',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(global.alert).toHaveBeenCalledWith('Account created successfully! Please login.');
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows submit error from API failure response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already in use' }),
    });

    render(<SignUp />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});