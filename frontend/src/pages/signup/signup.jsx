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
