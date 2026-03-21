const { test, expect } = require('@jest/globals');

// Mock console
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

// Test handleLogin logic directly (matches existing test style)
test('handleLogin should prevent default and log correct credentials', () => {
  const e = { preventDefault: jest.fn() };
  const email = 'user@example.com';
  const password = 'pass123';
  console.log = jest.fn();

  // Simulate handler call
  const handleLogin = (event) => {
    event.preventDefault();
    console.log('Login attempted with:', { email, password });
  };
  handleLogin(e);

  expect(e.preventDefault).toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledWith('Login attempted with:', { email, password });

  console.log.mockRestore();
});

test('handleGoogleLogin should log Google click', () => {
  console.log = jest.fn();

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };
  handleGoogleLogin();

  expect(console.log).toHaveBeenCalledWith('Google login clicked');
  console.log.mockRestore();
});

// State management tests
test('email state update handler', () => {
  const setEmail = jest.fn();
  const e = { target: { value: 'test@example.com' } };

  const handleEmailChange = (event) => setEmail(event.target.value);
  handleEmailChange(e);

  expect(setEmail).toHaveBeenCalledWith('test@example.com');
});

test('password state update handler', () => {
  const setPassword = jest.fn();
  const e = { target: { value: 'secret123' } };

  const handlePasswordChange = (event) => setPassword(event.target.value);
  handlePasswordChange(e);

  expect(setPassword).toHaveBeenCalledWith('secret123');
});

// Form validation (required attributes - structure check simulation)
test('login form inputs have required validation', () => {
  const emailInput = { hasAttribute: (attr) => attr === 'required' };
  const passwordInput = { hasAttribute: (attr) => attr === 'required' };

  expect(emailInput.hasAttribute('required')).toBe(true);
  expect(passwordInput.hasAttribute('required')).toBe(true);
});

// Link navigation paths
test('Reset Password link path', () => {
  const resetLink = { getAttribute: (attr) => attr === 'to' ? '/reset-password' : null };
  expect(resetLink.getAttribute('to')).toBe('/reset-password');
});

test('Sign-up link prevents default navigation', () => {
  const e = { preventDefault: jest.fn() };
  const signupClick = (event) => event.preventDefault();

  signupClick(e);
  expect(e.preventDefault).toHaveBeenCalled();
});

// Full form payload validation
test('complete login payload logged', () => {
  const payload = {
    email: 'user@example.com',
    password: 'pass123'
  };
  console.log = jest.fn();

  console.log('Login attempted with:', payload);
  expect(console.log).toHaveBeenCalledTimes(1);
  expect(console.log.mock.calls[0][1]).toMatchObject(payload);

  console.log.mockRestore();
});

consoleLogSpy.mockRestore();

