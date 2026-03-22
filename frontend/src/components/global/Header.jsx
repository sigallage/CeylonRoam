import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/icon.jpeg';
import { LoginButton, SignUpButton } from '../loginButton';
import { useTheme } from '../../context/ThemeContext';

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { isDarkMode, toggleTheme } = useTheme();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [profile, setProfile] = useState({ name: '', email: '', avatar: '' });

	useEffect(() => {
		function readAuthState() {
			try {
				const rawUser = window.localStorage.getItem('ceylonroam_user');
				const loggedIn = Boolean(rawUser);
				setIsLoggedIn(loggedIn);

				if (rawUser) {
					let parsed = {};
					try {
						parsed = JSON.parse(rawUser);
					} catch {
						parsed = {};
					}

					setProfile({
						name: parsed?.name || parsed?.fullName || '',
						email: parsed?.email || '',
						avatar: parsed?.avatar || parsed?.photoURL || parsed?.profileImage || '',
					});
				} else {
					setProfile({ name: '', email: '', avatar: '' });
				}
			} catch {
				setIsLoggedIn(false);
				setProfile({ name: '', email: '', avatar: '' });
			}
		}

		readAuthState();
		window.addEventListener('storage', readAuthState);
		return () => window.removeEventListener('storage', readAuthState);
	}, [location.pathname]);

	function handleLogout() {
		try {
			window.localStorage.removeItem('ceylonroam_user');
		} catch {
			// ignore storage issues
		}
		setIsLoggedIn(false);
		setProfile({ name: '', email: '', avatar: '' });
		setIsMenuOpen(false);
		navigate('/login');
	}

	const firstInitial = (profile.name?.trim()?.charAt(0) || profile.email?.trim()?.charAt(0) || 'U').toUpperCase();

	const navClass = isDarkMode
		? 'relative z-20 flex justify-between items-center px-8 py-6 bg-black'
		: 'relative z-20 flex justify-between items-center px-8 py-6 bg-white border-b border-gray-200';

	const titleClass = isDarkMode ? 'text-3xl font-bold text-white tracking-tight' : 'text-3xl font-bold text-gray-900 tracking-tight';
	const iconButtonClass = isDarkMode ? 'text-white focus:outline-none' : 'text-gray-900 focus:outline-none';
	const menuItemBaseClass = 'text-left text-lg font-medium transition-all duration-300 py-3 px-4 rounded-xl';
	const menuItemTextClass = isDarkMode ? 'text-white' : 'text-gray-900';

	return (
		<nav className={navClass}>
			<div className="flex items-center gap-3 animate-fade-in cursor-pointer" onClick={() => navigate('/') }>
				<div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
					<img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
				</div>
				<h1 className={titleClass}>
					Ceylon<span className="text-yellow-400">Roam</span>
				</h1>
			</div>
			
			<div className="flex items-center gap-4">
				<button
					onClick={() => {
						toggleTheme();
						setIsMenuOpen(false);
					}}
					className="rounded-lg border border-yellow-400/70 bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300 px-3 py-2 text-xs font-semibold text-black"
					title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
				>
					{isDarkMode ? 'Light Mode' : 'Dark Mode'}
				</button>

				{!isLoggedIn && (
					<>
						<LoginButton
							onClick={() => {
								navigate('/login');
								setIsMenuOpen(false);
							}}
						/>
						<SignUpButton
							onClick={() => {
								navigate('/signup');
								setIsMenuOpen(false);
							}}
						/>
					</>
				)}

				{isLoggedIn && (
					<div className={isDarkMode
						? 'hidden sm:flex items-center gap-3 rounded-full border border-yellow-500/40 bg-black/40 px-3 py-1.5'
						: 'hidden sm:flex items-center gap-3 rounded-full border border-yellow-500/30 bg-white px-3 py-1.5'}>
						{profile.avatar ? (
							<img
								src={profile.avatar}
								alt={profile.name}
								className="h-8 w-8 rounded-full object-cover border border-yellow-500/60"
							/>
						) : (
							<div className="h-8 w-8 rounded-full border border-yellow-500/60 bg-gradient-to-br from-yellow-500 to-amber-600 text-xs font-bold text-black flex items-center justify-center">
								{firstInitial}
							</div>
						)}
						{profile.name && (
							<div className={isDarkMode
								? 'max-w-[160px] truncate text-sm font-semibold text-white'
								: 'max-w-[160px] truncate text-sm font-semibold text-gray-900'}>
								{profile.name}
							</div>
						)}
					</div>
				)}

				
				{/* Hamburger Menu Button */}
				<button 
					className={iconButtonClass}
					onClick={() => setIsMenuOpen(!isMenuOpen)}
				>
					<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{isMenuOpen ? (
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						) : (
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						)}
					</svg>
				</button>
			</div>

			{/* Menu */}
			{isMenuOpen && (
				<div className={isDarkMode
					? 'absolute top-full right-4 mt-2 w-50 bg-gradient-to-br from-black/30 via-gray-900/30 to-black/30 backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 animate-fade-in'
					: 'absolute top-full right-4 mt-2 w-50 bg-white border border-gray-200 rounded-2xl shadow-2xl animate-fade-in'}>
					<div className="flex flex-col p-4 gap-2">
						<button
							type="button"
							className={`${menuItemBaseClass} ${menuItemTextClass} hover:text-yellow-400 hover:bg-yellow-400/10`}
							onClick={() => {
								setIsMenuOpen(false);
								navigate('/', { state: { scrollTo: 'features' } });
							}}
						>
							Features
						</button>
						<button
							type="button"
							className={`${menuItemBaseClass} ${menuItemTextClass} hover:text-amber-400 hover:bg-amber-400/10`}
							onClick={() => {
								setIsMenuOpen(false);
								navigate('/', { state: { scrollTo: 'destinations' } });
							}}
						>
							Experiences
						</button>
						<button
							type="button"
							className={`${menuItemBaseClass} ${menuItemTextClass} hover:text-amber-400 hover:bg-amber-400/10`}
							onClick={() => {
								setIsMenuOpen(false);
								navigate('/about-us');
							}}
						>
							About
					</button>
						{isLoggedIn && (
							<>
								<button
									type="button"
									className={`${menuItemBaseClass} ${menuItemTextClass} hover:text-yellow-400 hover:bg-yellow-400/10`}
									onClick={() => {
										setIsMenuOpen(false);
										navigate('/profile');
									}}
								>
									Profile
								</button>
								<button
									onClick={handleLogout}
									className={`${menuItemBaseClass} ${menuItemTextClass} ${isDarkMode ? 'hover:text-red-300' : 'hover:text-red-600'} hover:bg-red-500/10`}
								>
									Logout
								</button>
							</>
						)}
					</div>
				</div>
			)}
		</nav>
	);
};

export default Header;
