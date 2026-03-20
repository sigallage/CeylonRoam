import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from './LoginPage';
import ResetPassword from './ResetPassword';
import ForgotPassword from './ForgotPassword';
import SignUpPage from './SignUpPage';

const mockNavigate = jest.fn();
let mockLocation = { state: {} };

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

jest.mock('../../config/backendUrls', () => ({
  getAuthBaseUrl: () => 'http://localhost:5001',
}));

function makeResponse({ ok = true, payload = {}, contentType = 'application/json' }) {
  return {
    ok,
    headers: { get: () => contentType },
    json: async () => payload,
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('logs in successfully and navigates home', async () => {
    global.fetch.mockResolvedValue(
      makeResponse({ ok: true, payload: { id: 1, email: 'user@example.com' } }),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Login' }).closest('form'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/login',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/');
    expect(window.localStorage.getItem('ceylonroam_user')).toContain('user@example.com');
  });

  it('shows api error when login fails', async () => {
    global.fetch.mockResolvedValue(
      makeResponse({ ok: false, payload: { error: 'Invalid credentials' } }),
    );

    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'bad-password' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Login' }).closest('form'));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('ResetPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('shows message for invalid email and does not call API', async () => {
    render(<ResetPassword />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Continue' }).closest('form'));

    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('sends forgot-password request and navigates to OTP page', async () => {
    jest.useFakeTimers();
    global.fetch.mockResolvedValue(makeResponse({ ok: true, payload: { message: 'OTP sent' } }));

    render(<ResetPassword />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'user@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Continue' }).closest('form'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('OTP sent to your email. Check your inbox (or console in dev mode).')).toBeInTheDocument();

    jest.advanceTimersByTime(1500);
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password', {
      replace: true,
      state: { email: 'user@example.com' },
    });

    jest.useRealTimers();
  });
});

describe('ForgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockLocation = { state: {} };
  });

  it('shows missing email message when email state is absent', async () => {
    render(<ForgotPassword />);

    fireEvent.change(screen.getByLabelText('OTP Code'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Verify OTP' }).closest('form'));

    expect(await screen.findByText('Missing email. Please start from Reset Password.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('verifies OTP and advances to password reset step', async () => {
    jest.useFakeTimers();
    mockLocation = { state: { email: 'user@example.com' } };
    global.fetch.mockResolvedValue(makeResponse({ ok: true, payload: { message: 'verified' } }));

    render(<ForgotPassword />);

    fireEvent.change(screen.getByLabelText('OTP Code'), { target: { value: '123456' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Verify OTP' }).closest('form'));

    expect(await screen.findByText('OTP verified! Now set your new password.')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('heading', { name: 'Change Your Password' })).toBeInTheDocument();

    jest.useRealTimers();
  });
});

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  it('signs up successfully and navigates to planner', async () => {
    global.fetch.mockResolvedValue(
      makeResponse({ ok: true, payload: { id: 1, email: 'new@example.com' } }),
    );

    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText('Full Name (optional)'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Username (optional)'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign Up' }).closest('form'));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/api/signup',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(window.localStorage.getItem('ceylonroam_user')).toContain('new@example.com');
    expect(mockNavigate).toHaveBeenCalledWith('/planner');
  });

  it('shows error message when signup fails', async () => {
    global.fetch.mockResolvedValue(
      makeResponse({ ok: false, payload: { error: 'Email already exists' } }),
    );

    render(<SignUpPage />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'taken@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Sign Up' }).closest('form'));

    expect(await screen.findByText('Email already exists')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
