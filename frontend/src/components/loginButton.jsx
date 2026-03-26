import { useTheme } from '../context/ThemeContext';

export const LoginButton = ({ onClick }) => {
	const { isDarkMode } = useTheme();

	return (
		<button
			className={isDarkMode
				? 'ml-0 sm:ml-8 px-4 sm:px-6 py-2 rounded-full bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-all duration-200 whitespace-nowrap'
				: 'ml-0 sm:ml-8 px-4 sm:px-6 py-2 rounded-full bg-black/5 border border-gray-300 text-gray-900 font-semibold hover:bg-black/10 transition-all duration-200 whitespace-nowrap'}
			onClick={onClick}
		>
			Login
		</button>
	);
};

export const SignUpButton = ({ onClick }) => (
	<button
		className="ml-0 sm:ml-2 px-4 sm:px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold shadow hover:shadow-yellow-500/40 transition-all duration-200 whitespace-nowrap"
		onClick={onClick}
	>
		Sign Up
	</button>
);

export const LogoutButton = ({ onClick }) => {
	const { isDarkMode } = useTheme();

	return (
		<button
			className={isDarkMode
				? 'ml-2 px-6 py-2 rounded-full bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-all duration-200'
				: 'ml-2 px-6 py-2 rounded-full bg-black/5 border border-gray-300 text-gray-900 font-semibold hover:bg-black/10 transition-all duration-200'}
			onClick={onClick}
		>
			Log Out
		</button>
	);
};
