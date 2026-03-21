import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthBaseUrl } from '../../config/backendUrls';
import bgImage from '../../assets/2.jpg';

function SignUp() {
  const navigate = useNavigate();
  const authBaseUrl = useMemo(() => {
    return getAuthBaseUrl();
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance
    if (!acceptTerms) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${authBaseUrl}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to login or dashboard
        console.log('Signup successful:', data);
        alert('Account created successfully! Please login.');
        navigate('/login');
      } else {
        // Handle error response
        setErrors({ submit: data.error || 'Signup failed. Please try again.' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Add Google OAuth logic here
    console.log('Google signup clicked');
    // You can implement Google OAuth integration here
  };

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-black w-full max-w-[520px] rounded-[24px] border border-gray-800 shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden mx-auto">
            <img
              src={bgImage}
              alt="Sri Lanka"
              className="w-full h-64 object-cover md:h-full"
              loading="lazy"
            />
          </div>

          <div
            className="w-full max-w-[520px] rounded-[24px] p-[2.5px] mx-auto"
            style={{
              background: 'linear-gradient(to right, #facc15, #f97316)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
          >
            <div className="bg-black rounded-[22px] w-full h-full px-8 py-10 sm:px-12 sm:py-12">
              <div className="max-w-[380px] mx-auto">
              <h1 className="text-[30px] font-normal text-white mb-10 text-center leading-tight">
                Create Your Account
              </h1>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="name" className="block mb-2 text-white font-normal text-[17px]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className={`w-full px-4 border bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none transition-colors box-border ${
                      errors.name ? 'border-red-500' : 'border-gray-700 focus:border-gray-400'
                    }`}
                    style={{ height: '48px' }}
                  />
                  {errors.name ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 text-white font-normal text-[17px]">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="me@example.com"
                    required
                    className={`w-full px-4 border bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none transition-colors box-border ${
                      errors.email ? 'border-red-500' : 'border-gray-700 focus:border-gray-400'
                    }`}
                    style={{ height: '48px' }}
                  />
                  {errors.email ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="password" className="block mb-2 text-white font-normal text-[17px]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      required
                      className={`w-full px-4 border bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none transition-colors box-border ${
                        errors.password ? 'border-red-500' : 'border-gray-700 focus:border-gray-400'
                      }`}
                      style={{ height: '48px' }}
                    />
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        style={{ background: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <defs>
                              <linearGradient id="eyeGradientSignup" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" fill="none" stroke="url(#eyeGradientSignup)" strokeWidth="1.6"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="url(#eyeGradientSignup)" strokeWidth="1.6"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <defs>
                              <linearGradient id="eyeGradientSignup" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" fill="none" stroke="url(#eyeGradientSignup)" strokeWidth="1.6"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="url(#eyeGradientSignup)" strokeWidth="1.6"/>
                            <path d="M4 4l16 16" stroke="url(#eyeGradientSignup)" strokeWidth="1.6"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  {errors.password ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.password}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block mb-2 text-white font-normal text-[17px]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      required
                      className={`w-full px-4 border bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none transition-colors box-border ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-700 focus:border-gray-400'
                      }`}
                      style={{ height: '48px' }}
                    />
                    {formData.confirmPassword && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        style={{ background: 'none', border: 'none', outline: 'none', cursor: 'pointer' }}
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <defs>
                              <linearGradient id="eyeGradientSignup2" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" fill="none" stroke="url(#eyeGradientSignup2)" strokeWidth="1.6"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="url(#eyeGradientSignup2)" strokeWidth="1.6"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <defs>
                              <linearGradient id="eyeGradientSignup2" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" fill="none" stroke="url(#eyeGradientSignup2)" strokeWidth="1.6"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="url(#eyeGradientSignup2)" strokeWidth="1.6"/>
                            <path d="M4 4l16 16" stroke="url(#eyeGradientSignup2)" strokeWidth="1.6"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  {errors.confirmPassword ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.confirmPassword}</p>
                  ) : null}
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.terms && e.target.checked) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                    className="mt-1 w-4 h-4"
                  />
                  <label htmlFor="terms" className="text-gray-300 text-[14px]">
                    I agree to the{' '}
                    <a href="#" className="text-[#f59e0b] hover:underline">
                      Terms and Conditions
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-[#f59e0b] hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.terms ? (
                  <p className="text-red-600 text-[14px] -mt-2">{errors.terms}</p>
                ) : null}

                {errors.submit ? (
                  <p className="text-red-600 text-[14px] mt-1">{errors.submit}</p>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-[6px] text-[16px] font-medium transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    height: '45px',
                    background: 'linear-gradient(to right, #facc15, #f97316)',
                    color: '#222',
                    boxShadow: '0 0 12px rgba(250,204,21,0.10)'
                  }}
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-black text-gray-300 text-[14px]">or sign up with</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignup}
                type="button"
                className="w-full py-2.5 bg-black border border-gray-800 rounded-[6px] flex items-center justify-center hover:bg-gray-900 transition-colors"
              >
                <svg width="20" height="28" viewBox="0 0 24 24" className="flex-shrink-0">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>

              <div className="mt-6 text-center text-[15px] text-gray-300">
                <span>Already have an account? </span>
                <Link to="/login" className="text-[#f59e0b] font-medium hover:underline">
                  Login
                </Link>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
