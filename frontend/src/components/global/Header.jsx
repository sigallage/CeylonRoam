import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/icon.jpeg';
import { LogoutButton } from '../loginButton';

const Header = () => {
	const navigate = useNavigate();
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<nav className="relative z-20 flex justify-between items-center px-8 py-6 bg-black">
			<div className="flex items-center gap-3 animate-fade-in cursor-pointer" onClick={() => navigate('/') }>
				<div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
					<img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
				</div>
				<h1 className="text-3xl font-bold text-white tracking-tight">
					Ceylon<span className="text-yellow-400">Roam</span>
				</h1>
			</div>
			
			<div className="flex items-center gap-4">
				{/* Profile Icon */}
				<button 
					onClick={() => navigate('/profile')}
					className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden hover:opacity-80 transition-opacity"
				>
					<img src={logoIcon} alt="Profile" className="w-full h-full object-cover" />
				</button>
				
				{/* Hamburger Menu Button */}
				<button 
					className="text-white focus:outline-none"
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
				<div className="absolute top-full right-4 mt-2 w-80 bg-gradient-to-br from-black/30 via-gray-900/30 to-black/30 backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 animate-fade-in">
					<div className="flex flex-col p-4 gap-2">
						<button
							type="button"
							onClick={() => {
								navigate('/login');
								setIsMenuOpen(false);
							}}
							className="text-left text-white text-lg font-medium hover:text-yellow-400 hover:bg-yellow-400/10 transition-all duration-300 py-3 px-4 rounded-xl"
						>
							Log In
						</button>
						<button
							type="button"
							onClick={() => {
								navigate('/signup');
								setIsMenuOpen(false);
							}}
							className="text-left text-white text-lg font-medium hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-300 py-3 px-4 rounded-xl"
						>
							Sign Up
						</button>
						<a 
							href="#features" 
							className="text-white text-lg font-medium hover:text-yellow-400 hover:bg-yellow-400/10 transition-all duration-300 py-3 px-4 rounded-xl" 
							onClick={() => setIsMenuOpen(false)}
						>
							Features
						</a>
						<a 
							href="#destinations" 
							className="text-white text-lg font-medium hover:text-amber-400 hover:bg-amber-400/10 transition-all duration-300 py-3 px-4 rounded-xl" 
							onClick={() => setIsMenuOpen(false)}
						>
							Experiences
						</a>
						<a 
							href="#about" 
							className="text-white text-lg font-medium hover:text-orange-400 hover:bg-orange-400/10 transition-all duration-300 py-3 px-4 rounded-xl" 
							onClick={() => setIsMenuOpen(false)}
						>
							About
						</a>
						<div className="mt-2 pt-4 border-t border-white/20">
							<LogoutButton />
						</div>
					</div>
				</div>
			)}
		</nav>
	);
};

export default Header;
