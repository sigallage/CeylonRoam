import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuthBaseUrl } from '../../config/backendUrls';
import { postJson } from '../../utils/httpClient';
import { useTheme } from '../../context/ThemeContext';

function ForgotPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const authBaseUrl = useMemo(() => getAuthBaseUrl(), []);

  const [step, setStep] = useState(1); // 1: OTP verification, 2: Password reset
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const email = String(location?.state?.email || '').trim();

  const canVerifyOtp = useMemo(() => {
    const trimmed = String(otp || '').trim();
    return Boolean(email) && trimmed.length >= 4;
  }, [email, otp]);

  const canSubmitPassword = useMemo(() => {
    return Boolean(email) && String(newPassword || '').length >= 6 && newPassword === confirmPassword;
  }, [email, newPassword, confirmPassword]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!canVerifyOtp) return;
    setMessage('');
    setIsLoading(true);
    try {
      const resp = await postJson(`${authBaseUrl}/api/verify-otp`, { email, otp: String(otp).trim() });
      if (!resp.ok) {
        const payload = resp.data;
        const errorMessage = typeof payload === 'string'
          ? payload
          : payload?.message || payload?.error || `Invalid OTP (HTTP ${resp.status})`;
        setMessage(errorMessage);
        return;
      }

      const payload = resp.data;
      if (payload && typeof payload === 'object' && payload.resetToken) {
        setResetToken(String(payload.resetToken));
      }
      setMessage('OTP verified! Now set your new password.');
      setTimeout(() => {
        setMessage('');
        setStep(2);
      }, 900);
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
    setIsLoading(true);
    try {
      const resp = await postJson(`${authBaseUrl}/api/reset-password`, {
        email,
        newPassword,
        ...(resetToken ? { resetToken } : {}),
      });
      if (!resp.ok) {
        const payload = resp.data;
        const errorMessage = typeof payload === 'string'
          ? payload
          : payload?.message || payload?.error || `Reset failed (HTTP ${resp.status})`;
        setMessage(errorMessage);
        return;
      }

      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      console.error('Reset password error:', err);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className={isDarkMode ? 'min-h-screen bg-black/95 px-4 py-10 flex items-center justify-center' : 'min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center'}>
        <div className={isDarkMode
          ? 'w-full max-w-[480px] bg-[#1f1f1f] rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-yellow-500/40 px-8 py-10 sm:px-12 sm:py-12'
          : 'w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-gray-200 px-8 py-10 sm:px-12 sm:py-12'}>
          <div className="max-w-[380px] mx-auto text-center">
            <h1 className={isDarkMode ? 'text-[28px] font-normal text-yellow-400' : 'text-[28px] font-normal text-gray-900'}>
              Forgot Password
            </h1>
            <p className={isDarkMode ? 'mt-3 text-[15px] text-white/75' : 'mt-3 text-[15px] text-gray-700'}>
              Missing email. Start from Reset Password.
            </p>
            <div className="mt-6 text-center">
              <Link to="/reset-password" className={isDarkMode ? 'text-[15px] text-white hover:text-yellow-300 hover:underline' : 'text-[15px] text-gray-900 hover:text-amber-700 hover:underline'}>
                Go to Reset Password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'min-h-screen bg-black/95 px-4 py-10 flex items-center justify-center' : 'min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center'}>
      <div className={isDarkMode
        ? 'w-full max-w-[480px] bg-[#1f1f1f] rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-yellow-500/40 px-8 py-10 sm:px-12 sm:py-12'
        : 'w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.12)] border border-gray-200 px-8 py-10 sm:px-12 sm:py-12'}>
        <div className="max-w-[380px] mx-auto text-center">
          <h1 className={isDarkMode ? 'text-[28px] font-normal text-yellow-400' : 'text-[28px] font-normal text-gray-900'}>
            {step === 1 ? 'Verify OTP' : 'Set New Password'}
          </h1>
          <p className={isDarkMode ? 'mt-3 text-[15px] text-white/75' : 'mt-3 text-[15px] text-gray-700'}>
            {step === 1
              ? `Enter the OTP sent to ${email}.`
              : 'Choose a new password (min 6 characters).'}
          </p>

          {step === 1 ? (
            <form onSubmit={handleVerifyOtp} className="mt-8 text-left">
              <label htmlFor="otp" className={isDarkMode ? 'block text-[14px] text-white/75 mb-2' : 'block text-[14px] text-gray-700 mb-2'}>
                OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className={isDarkMode
                  ? 'w-full h-12 rounded-[8px] border border-white/20 bg-black/40 px-4 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50'
                  : 'w-full h-12 rounded-[8px] border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500'}
                autoComplete="one-time-code"
                required
              />

              <button
                type="submit"
                disabled={isLoading || !canVerifyOtp}
                className="mt-4 h-12 w-full rounded-[10px] bg-yellow-500 text-black text-[16px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
              >
                {isLoading ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitPassword} className="mt-8 text-left">
              <label htmlFor="newPassword" className={isDarkMode ? 'block text-[14px] text-white/75 mb-2' : 'block text-[14px] text-gray-700 mb-2'}>
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={isDarkMode
                  ? 'w-full h-12 rounded-[8px] border border-white/20 bg-black/40 px-4 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50'
                  : 'w-full h-12 rounded-[8px] border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500'}
                required
              />

              <label htmlFor="confirmPassword" className={isDarkMode ? 'block text-[14px] text-white/75 mb-2 mt-4' : 'block text-[14px] text-gray-700 mb-2 mt-4'}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={isDarkMode
                  ? 'w-full h-12 rounded-[8px] border border-white/20 bg-black/40 px-4 text-[16px] text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400/50'
                  : 'w-full h-12 rounded-[8px] border border-gray-300 bg-white px-4 text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-500'}
                required
              />

              <button
                type="submit"
                disabled={isLoading || !canSubmitPassword}
                className="mt-4 h-12 w-full rounded-[10px] bg-yellow-500 text-black text-[16px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
              >
                {isLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          )}

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

export default ForgotPassword;