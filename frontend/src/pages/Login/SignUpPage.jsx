import { Link } from 'react-router-dom';

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4 py-8">
      <div className="bg-white w-full max-w-[520px] rounded-[24px] border border-[#e5e7eb] shadow-[0_20px_40px_rgba(15,23,42,0.08)] px-8 py-10 sm:px-12 sm:py-12">
        <div className="max-w-[420px] mx-auto text-center">
          <h1 className="text-[26px] font-normal text-[#333] mb-3">Sign Up</h1>
          <p className="text-[#666] text-[15px] mb-8">
            Add your sign-up flow here.
          </p>
          <Link to="/login" className="text-[#2c3e9e] hover:underline text-[15px]">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
