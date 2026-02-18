import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const isValidEmail = (value) => {
  // Simple, practical check (not RFC-perfect)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');

  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const otpOk = useMemo(() => /^\d{6}$/.test(otp), [otp]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    setMessage('');

    if (!emailOk) {
      setMessage('Please enter a valid email address.');
      setEmailSubmitted(false);
      return;
    }

    // TODO: call backend to send OTP
    console.log('Send OTP to', email);
    setEmailSubmitted(true);
    setMessage('OTP sent. Please check your email.');
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setMessage('');

    if (!emailSubmitted) return;

    if (!otpOk) {
      setMessage('Enter the 6-digit OTP.');
      return;
    }

    // TODO: call backend to verify OTP
    console.log('Verify OTP', { email, otp });

    // Go to Change Password page
    navigate('/forgot-password', { replace: true, state: { email } });
  };

  return (
    <div className="min-h-screen bg-black/95 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-black/10 px-8 py-10 sm:px-12 sm:py-12">
        <div className="max-w-[380px] mx-auto text-center">
          <h1 className="text-[28px] font-normal text-[#111]">Reset Password</h1>
          <p className="mt-3 text-[15px] text-[#444]">
            Enter your email. If it’s valid, we’ll show the OTP field.
          </p>

          <form onSubmit={handleSendOtp} className="mt-8 text-left">
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
              className="mt-4 h-12 w-full rounded-[10px] bg-black text-white text-[16px] font-medium hover:bg-black/90 transition-colors"
            >
              Send OTP
            </button>
          </form>

          {emailSubmitted && (
            <form onSubmit={handleVerifyOtp} className="mt-6 text-left">
              <label htmlFor="otp" className="block text-[14px] text-black/70 mb-2">
                OTP
              </label>
              <input
                id="otp"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                className="w-full h-12 rounded-[8px] border border-black/20 px-4 text-[16px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 tracking-widest"
                aria-describedby="otpHelp"
                required
              />
              <div id="otpHelp" className="mt-2 text-[13px] text-black/60">
                Use the 6-digit code sent to your email.
              </div>

              <button
                type="submit"
                className="mt-4 h-12 w-full rounded-[10px] bg-black text-white text-[16px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-colors"
                disabled={!otpOk}
              >
                Verify OTP
              </button>
            </form>
          )}

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
