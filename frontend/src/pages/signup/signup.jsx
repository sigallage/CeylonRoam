import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthBaseUrl } from '../../config/backendUrls';
import { postJson } from '../../utils/httpClient';
import bgImage from '../../assets/2.jpg';
import { useTheme } from '../../context/ThemeContext';

function SignUp() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
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
      const resp = await postJson(`${authBaseUrl}/api/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      const data = resp.data;
      if (!resp.ok) {
        const message = typeof data === 'string'
          ? data
          : data?.message || data?.error || `Signup failed (HTTP ${resp.status})`;
        setErrors({ submit: message });
        return;
      }
      console.log('Signup successful:', data);
      alert('Account created successfully! Please login.');
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const pageClass = isDarkMode ? 'min-h-screen w-full bg-black' : 'min-h-screen w-full bg-gray-100';
  const cardClass = isDarkMode
    ? 'bg-black w-full max-w-[520px] rounded-[24px] border border-gray-800 shadow-[0_20px_40px_rgba(0,0,0,0.5)]'
    : 'bg-white w-full max-w-[520px] rounded-[24px] border border-gray-200 shadow-[0_20px_40px_rgba(0,0,0,0.12)]';
  const titleClass = isDarkMode
    ? 'text-[30px] font-normal text-white mb-10 text-center leading-tight'
    : 'text-[30px] font-normal text-gray-900 mb-10 text-center leading-tight';
  const labelClass = isDarkMode ? 'block mb-2 text-white font-normal text-[17px]' : 'block mb-2 text-gray-900 font-normal text-[17px]';
  const helperClass = isDarkMode ? 'text-gray-400 text-[14px]' : 'text-gray-500 text-[14px]';
  const inputBase = isDarkMode
    ? 'w-full px-4 border bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none transition-colors box-border'
    : 'w-full px-4 border bg-white text-gray-900 rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none transition-colors box-border';
  const inputBorderOk = isDarkMode ? 'border-gray-700 focus:border-gray-400' : 'border-gray-300 focus:border-amber-500';

  return (
    <div className={pageClass}>
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className={`${cardClass} overflow-hidden mx-auto`}>
            <img
              src={bgImage}
              alt="Sri Lanka"
              className="w-full h-64 object-cover md:h-full"
              loading="lazy"
            />
          </div>

          <div className={`${cardClass} px-8 py-10 sm:px-12 sm:py-12 mx-auto`}>
            <div className="max-w-[380px] mx-auto">
              <h1 className={titleClass}>
                Create Your Account
              </h1>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Full Name <span className={helperClass}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`${inputBase} ${inputBorderOk}`}
                    style={{ height: '48px' }}
                  />
                  {errors.name ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.name}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
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
                    className={`${inputBase} ${errors.email ? 'border-red-500' : inputBorderOk}`}
                    style={{ height: '48px' }}
                  />
                  {errors.email ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.email}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    required
                    className={`${inputBase} ${errors.password ? 'border-red-500' : inputBorderOk}`}
                    style={{ height: '48px' }}
                  />
                  {errors.password ? (
                    <p className="text-red-600 text-[14px] mt-1">{errors.password}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                    className={`${inputBase} ${errors.confirmPassword ? 'border-red-500' : inputBorderOk}`}
                    style={{ height: '48px' }}
                  />
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
                  <label htmlFor="terms" className={isDarkMode ? 'text-gray-300 text-[14px]' : 'text-gray-700 text-[14px]'}>
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


              <div className={isDarkMode ? 'mt-6 text-center text-[15px] text-gray-300' : 'mt-6 text-center text-[15px] text-gray-700'}>
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
  );
}

export default SignUp;
