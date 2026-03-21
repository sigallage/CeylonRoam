import logoIcon from '../../assets/icon.jpeg';
import { useTheme } from '../../context/ThemeContext';

const Footer = () => {
	const { isDarkMode } = useTheme();

	const footerClass = isDarkMode ? 'relative py-8 px-8 bg-black' : 'relative py-8 px-8 bg-white border-t border-gray-200';
	const titleClass = isDarkMode ? 'text-3xl font-bold text-white tracking-tight' : 'text-3xl font-bold text-gray-900 tracking-tight';
	const linkClass = isDarkMode ? 'hover:text-yellow-400 transition-colors' : 'hover:text-yellow-600 transition-colors';
	const bodyTextClass = isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm';
	return (
		<footer className={footerClass}>
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-center gap-8">
					{/* Logo */}
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
							<img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
						</div>
						<h1 className={titleClass}>
							Ceylon<span className="text-yellow-400">Roam</span>
						</h1>
					</div>

					{/* Navigation Links */}
					<div className={isDarkMode ? 'flex flex-wrap justify-center gap-8 text-white font-medium' : 'flex flex-wrap justify-center gap-8 text-gray-900 font-medium'}>
						<a href="#features" className={linkClass}>Features</a>
						<a href="#destinations" className={linkClass}>Experiences</a>
						<a href="#about" className={linkClass}>About</a>
						<a href="#" className={linkClass}>Contact</a>
					</div>

					{/* Contact Info */}
					<div className="text-center md:text-right">
						<p className={bodyTextClass}>info@ceylonroam.lk</p>
						<p className={bodyTextClass}>+94 11 234 5678</p>
					</div>
				</div>

				{/* Bottom Copyright */}
				<div className={isDarkMode ? 'mt-8 pt-6 border-t border-gray-800 text-center' : 'mt-8 pt-6 border-t border-gray-200 text-center'}>
					<p className={bodyTextClass}>© 2025 CeylonRoam. All rights reserved. Made with love in Sri Lanka</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
