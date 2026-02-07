import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return true;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  const canSubmit = newPassword.length > 0 && confirmPassword.length > 0 && passwordsMatch;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    // TODO: wire to your backend reset-password endpoint
    console.log('Reset password submitted');
  };

  return (
    <div className="min-h-screen bg-black/95 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_30px_80px_rgba(0,0,0,0.45)] border border-black/10 px-8 py-10 sm:px-12 sm:py-12">
        <div className="max-w-[380px] mx-auto text-center">

          <h1 className="text-[28px] font-normal text-[#111]">Change Your Password</h1>
          <p className="mt-3 text-[15px] text-[#444]">
            Enter a new password below to change your password.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 text-left">
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
                  className="w-full h-12 rounded-[8px] border border-black/20 px-4 pr-12 text-[16px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/60 hover:text-black"
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
                  className="w-full h-12 rounded-[8px] border px-4 pr-12 text-[16px] placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
                  style={{
                    borderColor: passwordsMatch ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.45)',
                  }}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-black/60 hover:text-black"
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
                <p className="mt-2 text-[13px] text-black/70">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-3 h-12 w-full rounded-[10px] bg-black text-white text-[16px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/90 transition-colors"
            >
              Reset password
            </button>
          </form>

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

export default ForgotPassword;