import logoIcon from '../../assets/icon.jpeg';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const Footer = () => {
	const navigate = useNavigate();
	const { isDarkMode } = useTheme();

	const footerClass = isDarkMode
		? 'w-full bg-black px-6 py-10'
		: 'w-full bg-white px-6 py-10 border-t border-gray-200';

	const titleClass = isDarkMode
		? 'text-2xl font-bold text-white tracking-tight'
		: 'text-2xl font-bold text-gray-900 tracking-tight';

	const bodyTextClass = isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm';

	const linkRowClass = isDarkMode
		? 'flex flex-wrap justify-center gap-8 text-white font-medium ml-[-60px]'
		: 'flex flex-wrap justify-center gap-8 text-gray-900 font-medium ml-[-60px]';

	const linkBaseClass = isDarkMode
		? 'transition-colors bg-transparent border-none outline-none text-white font-medium'
		: 'transition-colors bg-transparent border-none outline-none text-gray-900 font-medium';

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
					<div className={linkRowClass}>
						<button
							type="button"
							className={`${linkBaseClass} hover:text-yellow-400`}
							style={{font: 'inherit', padding: 0, margin: 0, cursor: 'pointer'}}
							onClick={() => {
								navigate('/', { state: { scrollTo: 'features' } });
							}}
						>
							Features
						</button>
						<button
							type="button"
							className={`${linkBaseClass} hover:text-amber-400`}
							style={{font: 'inherit', padding: 0, margin: 0, cursor: 'pointer'}}
							onClick={() => {
								navigate('/', { state: { scrollTo: 'destinations' } });
							}}
						>
							Experiences
						</button>
						<button
							type="button"
							className={`${linkBaseClass} hover:text-orange-400`}
							style={{font: 'inherit', padding: 0, margin: 0, cursor: 'pointer'}}
							onClick={() => {
								navigate('/about-us');
							}}
						>
							About
						</button>
						<button
							type="button"
							className={`${linkBaseClass} hover:text-orange-400`}
							style={{font: 'inherit', padding: 0, margin: 0, cursor: 'pointer'}}
							onClick={() => {
								navigate('/faq');
							}}
						>
							Faq
						</button>
						{/* Contact link removed */}
					</div>

					{/* Contact Info */}
					<div className="text-center md:text-right">
						<p className="text-gray-400 text-sm">ceylon.roam144@gmail.com</p>
					</div>
				</div>

				{/* Bottom Copyright */}
				<div className={isDarkMode ? 'mt-8 pt-6 border-t border-gray-800 text-center' : 'mt-8 pt-6 border-t border-gray-200 text-center'}>
					<p className={bodyTextClass}>© 2026 CeylonRoam. All rights reserved. Made with love in Sri Lanka</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
