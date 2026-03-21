import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuthBaseUrl } from '../../config/backendUrls';
import { useTheme } from '../../context/ThemeContext';

function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();

	const { isDarkMode } = useTheme();

  const [step, setStep] = useState(1); // 1: OTP verification, 2: Password reset
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const email = location?.state?.email || '';

  const authBaseUrl = useMemo(() => getAuthBaseUrl(), []);

  const passwordsMatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return true;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const canVerifyOtp = otp.trim().length > 0;
  const canSubmitPassword = newPassword.length > 0 && confirmPassword.length > 0 && passwordsMatch;

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!canVerifyOtp) return;

    setMessage('');
    if (!email) {
      setMessage('Missing email. Please start from Reset Password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${authBaseUrl}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otp.trim() }),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const msg = typeof payload === 'string'
          ? payload
          : payload?.message || 'OTP verification failed. Please try again.';
        setMessage(msg);
        return;
      }

      if (payload && typeof payload === 'object' && payload.resetToken) {
        setResetToken(String(payload.resetToken));
      }

      setMessage('OTP verified! Now set your new password.');
      setTimeout(() => {
        setMessage('');
        setStep(2);
      }, 1000);
    } catch (err) {
      console.error('OTP verification error:', err);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setMessage('');
    if (!email) {
      setMessage('Missing email. Please start from Reset Password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${authBaseUrl}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, newPassword, ...(resetToken ? { resetToken } : {}) }),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const msg = typeof payload === 'string'
          ? payload
          : payload?.message || 'Reset failed. Please try again.';
        setMessage(msg);
        return;
      }

      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Reset password error:', err);
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

          {step === 1 ? (
            <>
              <h1 className={isDarkMode ? 'text-[28px] font-normal text-yellow-400' : 'text-[28px] font-normal text-gray-900'}>Verify OTP</h1>
              <p className={isDarkMode ? 'mt-3 text-[15px] text-white/75' : 'mt-3 text-[15px] text-gray-700'}>
                We sent a 6-digit code to your email. Please enter it below.
              </p>

              <form onSubmit={handleVerifyOtp} className="mt-8 text-left">
                <label htmlFor="otp" className={isDarkMode ? 'block text-[14px] text-white/75 mb-2' : 'block text-[14px] text-black/70 mb-2'}>
                  OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className={isDarkMode
                    ? 'w-full h-12 rounded-[8px] border border-white/20 bg-black/40 px-4 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50'
                    : 'w-full h-12 rounded-[8px] border border-black/20 bg-white px-4 text-[16px] text-gray-900 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30'}
                  autoComplete="one-time-code"
                  required
                />

                <button
                  type="submit"
                  disabled={!canVerifyOtp || isLoading}
                  className={isDarkMode
                    ? 'mt-4 h-12 w-full rounded-[10px] bg-yellow-500 text-black text-[16px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors'
                    : 'mt-4 h-12 w-full rounded-[10px] bg-black text-white text-[16px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-colors'}
                >
                  {isLoading ? 'Verifying…' : 'Verify OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className={isDarkMode ? 'text-[28px] font-normal text-yellow-400' : 'text-[28px] font-normal text-gray-900'}>Change Your Password</h1>
              <p className={isDarkMode ? 'mt-3 text-[15px] text-white/75' : 'mt-3 text-[15px] text-gray-700'}>
                Enter a new password below to change your password.
              </p>

              <form onSubmit={handleSubmitPassword} className="mt-8 flex flex-col gap-4 text-left">
                <div>
                  <label htmlFor="newPassword" className="sr-only">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password*"
                      className={isDarkMode
                        ? 'w-full h-12 rounded-[8px] border border-white/20 bg-black/40 px-4 pr-12 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50'
                        : 'w-full h-12 rounded-[8px] border border-black/20 bg-white px-4 pr-12 text-[16px] text-gray-900 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30'}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className={isDarkMode
                        ? 'absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white'
                        : 'absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/60 hover:text-black'}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Re-enter new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password*"
                      className={isDarkMode
                        ? 'w-full h-12 rounded-[8px] border bg-black/40 px-4 pr-12 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30'
                        : 'w-full h-12 rounded-[8px] border bg-white px-4 pr-12 text-[16px] text-gray-900 placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20'}
                      style={{
                        borderColor: passwordsMatch
                          ? (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')
                          : (isDarkMode ? 'rgba(250,204,21,0.7)' : 'rgba(0,0,0,0.45)'),
                      }}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className={isDarkMode
                        ? 'absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white'
                        : 'absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/60 hover:text-black'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                      </svg>
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p className={isDarkMode ? 'mt-2 text-[13px] text-white/75' : 'mt-2 text-[13px] text-black/70'}>
                      Passwords do not match.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitPassword || isLoading}
                  className={isDarkMode
                    ? 'mt-3 h-12 w-full rounded-[10px] bg-yellow-500 text-black text-[16px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors'
                    : 'mt-3 h-12 w-full rounded-[10px] bg-black text-white text-[16px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-colors'}
                >
                  {isLoading ? 'Resetting…' : 'Reset password'}
                </button>
              </form>
            </>
          )}

          {message ? (
            <div className={isDarkMode ? 'mt-5 text-center text-[14px] text-white/75' : 'mt-5 text-center text-[14px] text-black/70'}>{message}</div>
          ) : null}

          <div className="mt-6 text-center">
            <Link to="/login" className={isDarkMode ? 'text-[15px] text-white hover:text-yellow-300 hover:underline' : 'text-[15px] text-black/70 hover:underline'}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;