
export const LoginButton = ({ onClick }) => (
	<button
		className="ml-8 px-6 py-2 rounded-full bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-all duration-200"
		onClick={onClick}
	>
		Login
	</button>
);

export const SignUpButton = ({ onClick }) => (
	<button
		className="ml-2 px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold shadow hover:shadow-yellow-500/40 transition-all duration-200"
		onClick={onClick}
	>
		Sign Up
	</button>
);

export const LogoutButton = ({ onClick }) => (
	<button
		className="ml-2 px-6 py-2 rounded-full bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-all duration-200"
		onClick={onClick}
	>
		Log Out
	</button>
);
