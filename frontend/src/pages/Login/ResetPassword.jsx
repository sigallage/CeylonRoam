import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const isValidEmail = (value) => {
  // Simple, practical check (not RFC-perfect)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  const authBaseUrl = useMemo(
    () => import.meta.env.VITE_AUTH_URL?.replace(/\/$/, '') || 'http://localhost:5001',
    [],
  );

  const handleContinue = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!emailOk) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${authBaseUrl}/api/reset-password/request`, {
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

      if (payload?.exists) {
        navigate('/forgot-password', { replace: true, state: { email } });
      } else {
        setMessage(payload?.message || 'No account found with that email.');
      }
    } catch (err) {
      console.error('Reset password request error:', err);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black/95 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-black/10 px-8 py-10 sm:px-12 sm:py-12">
        <div className="max-w-[380px] mx-auto text-center">
          <h1 className="text-[28px] font-normal text-[#111]">Reset Password</h1>
          <p className="mt-3 text-[15px] text-[#444]">
            Enter your email to continue.
          </p>

          <form onSubmit={handleContinue} className="mt-8 text-left">
            <label htmlFor="resetEmail" className="block text-[14px] text-black/70 mb-2">
              Email
            </label>
            <input
              id="resetEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="me@example.com"
              className="w-full h-12 rounded-[8px] border border-black/20 px-4 text-[16px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
              autoComplete="email"
              required
            />

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 h-12 w-full rounded-[10px] bg-black text-white text-[16px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-colors"
            >
              {isLoading ? 'Checking…' : 'Continue'}
            </button>
          </form>

          {message && <div className="mt-5 text-center text-[14px] text-black/70">{message}</div>}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-[15px] text-black/70 hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
