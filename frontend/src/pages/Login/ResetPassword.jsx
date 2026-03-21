import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuthBaseUrl } from '../../config/backendUrls';
import { useTheme } from '../../context/ThemeContext';

const isValidEmail = (value) => {
  // Simple, practical check (not RFC-perfect)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

function ResetPassword() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  const authBaseUrl = useMemo(() => getAuthBaseUrl(), []);

  const handleContinue = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!emailOk) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${authBaseUrl}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const msg = typeof payload === 'string'
          ? payload
          : payload?.message || 'Request failed. Please try again.';
        setMessage(msg);
        return;
      }

      if (payload && typeof payload === 'object' && payload.mode === 'development') {
        setMessage(payload?.note || 'Email is not configured. Check server logs for OTP (development mode).');
      } else {
        setMessage('OTP sent to your email. Check your inbox (or spam).');
      }
      // Navigate to OTP verification page
      setTimeout(() => {
        navigate('/forgot-password', { replace: true, state: { email } });
      }, 1500);
    } catch (err) {
      console.error('Reset password request error:', err);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? 'min-h-screen bg-black/95 px-4 py-10 flex items-center justify-center' : 'min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center'}>
      <div className={isDarkMode
        ? 'w-full max-w-[480px] bg-[#1f1f1f] rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-yellow-500/40 px-8 py-10 sm:px-12 sm:py-12'
        : 'w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-gray-200 px-8 py-10 sm:px-12 sm:py-12'}>
        <div className="max-w-[380px] mx-auto text-center">
          <h1 className={isDarkMode ? 'text-[28px] font-normal text-yellow-400' : 'text-[28px] font-normal text-gray-900'}>Reset Password</h1>
          <p className={isDarkMode ? 'mt-3 text-[15px] text-white/75' : 'mt-3 text-[15px] text-gray-700'}>
            Enter your email to continue.
          </p>

          <form onSubmit={handleContinue} className="mt-8 text-left">
            <label htmlFor="resetEmail" className={isDarkMode ? 'block text-[14px] text-white/75 mb-2' : 'block text-[14px] text-gray-700 mb-2'}>
              Email
            </label>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="me@example.com"
              className={isDarkMode
                ? 'w-full h-12 rounded-[8px] border border-white/20 bg-black/40 px-4 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50'
                : 'w-full h-12 rounded-[8px] border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500'}
              autoComplete="email"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-12 w-full rounded-[10px] bg-yellow-500 text-black text-[16px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
            >
              {isLoading ? 'Checking…' : 'Continue'}
            </button>
          </form>

          {message && (
            <div className={isDarkMode ? 'mt-5 text-center text-[14px] text-white/75' : 'mt-5 text-center text-[14px] text-gray-700'}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className={isDarkMode ? 'text-[15px] text-white hover:text-yellow-300 hover:underline' : 'text-[15px] text-gray-900 hover:text-amber-700 hover:underline'}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
