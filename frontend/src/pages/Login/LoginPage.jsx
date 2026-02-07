import { useState } from 'react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Add your login logic here
    console.log('Login attempted with:', { email, password });
  };

  const handleGoogleLogin = () => {
    // Add Google OAuth logic here
    console.log('Google login clicked');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 py-8">
      <div className="bg-white w-full max-w-[520px] rounded-[24px] border border-[#e5e7eb] shadow-[0_20px_40px_rgba(15,23,42,0.08)] px-8 py-10 sm:px-12 sm:py-12">
        <div className="max-w-[380px] mx-auto">
          <h1 className="text-[30px] font-normal text-[#333] mb-10 text-center leading-tight">
            Welcome to Your Next Adventure
          </h1>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
                placeholder="Enter your password"
                required
                className="w-full px-4 border border-[#ddd] rounded-[6px] text-[16px] placeholder:text-[#999] focus:outline-none focus:border-[#2c3e9e] transition-colors box-border"
                style={{ height: '48px' }}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-[#1a1a1a] rounded-[6px] text-[16px] font-medium hover:bg-[#333] transition-colors mt-2"
              style={{ color: '#ffffff' , height: '45px'}}
            >
              <span style={{ color: '#ffffff'}}>Login</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#ddd]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-[#666] text-[14px]">or login with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            className="w-full py-2.5 bg-white border border-[#ddd] rounded-[6px] flex items-center justify-center hover:bg-[#f5f5f5] transition-colors"
          >
            <svg width="20" height="28" viewBox="0 0 24 24" className="flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;