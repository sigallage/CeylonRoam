import { useNavigate } from 'react-router-dom';
import logoIcon from '../../assets/icon.jpeg';
import { LoginButton, SignUpButton, LogoutButton } from '../loginButton';

const Header = () => {
	const navigate = useNavigate();
	return (
		<nav className="relative z-20 flex justify-between items-center px-8 py-6 bg-transparent">
			<div className="flex items-center gap-3 animate-fade-in cursor-pointer" onClick={() => navigate('/') }>
				<div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
					<img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
				</div>
				<h1 className="text-3xl font-bold text-white tracking-tight">
					Ceylon<span className="text-yellow-400">Roam</span>
				</h1>
			</div>
			<div className="hidden md:flex gap-8 text-white font-medium items-center">
				<a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
				<a href="#destinations" className="hover:text-amber-400 transition-colors">Experiences</a>
				<a href="#about" className="hover:text-orange-400 transition-colors">About</a>
				   <LoginButton />
				   <SignUpButton />
				   <LogoutButton />
			</div>
		</nav>
	);
};

export default Header;
