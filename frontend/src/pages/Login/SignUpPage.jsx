import { Link } from 'react-router-dom';

function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const authBaseUrl = useMemo(() => {
    const fromEnv = import.meta.env.VITE_AUTH_URL?.replace(/\/$/, '');
    if (fromEnv) return fromEnv;
    if (import.meta.env.DEV) return 'http://localhost:5001';
    return '';
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${authBaseUrl}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim() || undefined,
          username: username.trim() || undefined,
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
          : payload?.error || 'Signup failed. Please try again.';
        setError(message);
        return;
      }

      // Save user data to localStorage for auto-login
      try {
        window.localStorage.setItem('ceylonroam_user', JSON.stringify(payload));
      } catch {
        // ignore storage failures
      }

      // Navigate to planner instead of login
      navigate('/planner');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="bg-white w-full max-w-[520px] rounded-[24px] border border-[#e5e7eb] shadow-[0_20px_40px_rgba(15,23,42,0.08)] px-8 py-10 sm:px-12 sm:py-12">
        <div className="max-w-[380px] mx-auto">
          <h1 className="text-[30px] font-normal text-[#333] mb-10 text-center leading-tight">
            Create Your Account
          </h1>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label htmlFor="name" className="block mb-2 text-[#333] font-normal text-[17px]">
                Full Name <span className="text-[#999] text-[14px]">(optional)</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 border border-[#ddd] rounded-[6px] text-[16px] placeholder:text-[#999] focus:outline-none focus:border-[#2c3e9e] transition-colors box-border"
                style={{ height: '48px' }}
              />
            </div>

            <div>
              <label htmlFor="username" className="block mb-2 text-[#333] font-normal text-[17px]">
                Username <span className="text-[#999] text-[14px]">(optional)</span>
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="janedoe"
                className="w-full px-4 border border-[#ddd] rounded-[6px] text-[16px] placeholder:text-[#999] focus:outline-none focus:border-[#2c3e9e] transition-colors box-border"
                style={{ height: '48px' }}
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-2 text-[#333] font-normal text-[17px]">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="me@example.com"
                required
                className="w-full px-4 border border-[#ddd] rounded-[6px] text-[16px] placeholder:text-[#999] focus:outline-none focus:border-[#2c3e9e] transition-colors box-border"
                style={{ height: '48px' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-[#333] font-normal text-[17px]">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-4 border border-[#ddd] rounded-[6px] text-[16px] placeholder:text-[#999] focus:outline-none focus:border-[#2c3e9e] transition-colors box-border"
                style={{ height: '48px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1a1a1a] rounded-[6px] text-[16px] font-medium hover:bg-[#333] transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ color: '#ffffff', height: '45px' }}
            >
              <span style={{ color: '#ffffff' }}>{isLoading ? 'Creating account...' : 'Sign Up'}</span>
            </button>

            {error ? (
              <p className="text-red-600 text-[14px] mt-1">{error}</p>
            ) : null}
          </form>

          <div className="mt-6 text-center text-[15px] text-[#666]">
            <span>Already have an account? </span>
            <Link to="/login" className="text-[#f59e0b] font-medium hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
