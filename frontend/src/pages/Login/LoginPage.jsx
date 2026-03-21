import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthBaseUrl } from '../../config/backendUrls';
import bgImage from '../../assets/5.jpg';


function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const authBaseUrl = useMemo(() => getAuthBaseUrl(), []);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${authBaseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof payload === 'string'
          ? payload
          : payload?.error || 'Login failed. Please try again.';
        setError(message);
        return;
      }

      try {
        window.localStorage.setItem('ceylonroam_user', JSON.stringify(payload));
      } catch {
        // ignore storage failures (private mode, quota, etc.)
      }

      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please check your connection and try again.');
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
              <h1 className="text-[30px] font-normal text-white mb-10 text-center leading-tight mt-12">
                Welcome to Your Next Adventure
              </h1>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="mb-6">
                  <label htmlFor="email" className="block mb-2 text-white font-normal text-[17px]">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="me@example.com"
                    required
                    className="w-full px-4 border border-gray-700 bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors box-border"
                    style={{ height: '48px' }}
                  />
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <label htmlFor="password" className="text-white font-normal text-[17px]">
                      Password
                    </label>
                    <Link to="/reset-password" className="text-[#f59e0b] text-[14px] hover:underline font-medium">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 border border-gray-700 bg-black text-white rounded-[6px] text-[16px] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors box-border"
                      style={{ height: '48px' }}
                    />
                    {password && (
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
                              <linearGradient id="eyeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" fill="none" stroke="url(#eyeGradient)" strokeWidth="1.6"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="url(#eyeGradient)" strokeWidth="1.6"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <defs>
                              <linearGradient id="eyeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#facc15" />
                                <stop offset="100%" stopColor="#f97316" />
                              </linearGradient>
                            </defs>
                            <path d="M1.5 12s4-7.5 10.5-7.5S22.5 12 22.5 12s-4 7.5-10.5 7.5S1.5 12 1.5 12z" fill="none" stroke="url(#eyeGradient)" strokeWidth="1.6"/>
                            <circle cx="12" cy="12" r="3" fill="none" stroke="url(#eyeGradient)" strokeWidth="1.6"/>
                            <path d="M4 4l16 16" stroke="url(#eyeGradient)" strokeWidth="1.6"/>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>

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
                  {isLoading ? 'Logging in...' : <span style={{ fontWeight: 700 }}>Login</span>}
                </button>

                {error ? (
                  <p className="text-red-600 text-[14px] mt-1">{error}</p>
                ) : null}
              </form>


              <div className="mt-3 text-center text-[15px] text-gray-300">
                <div>
                  <span>New to CeylonRoam? </span>
                  <Link to="/signup" className="text-[#f59e0b] font-medium hover:underline">
                    Sign-up
                  </Link>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;