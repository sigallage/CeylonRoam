import logoIcon from '../../assets/icon.jpeg';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FaLinkedin, FaFacebook, FaGithub, FaYoutube, FaInstagram } from 'react-icons/fa';

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
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
					{/* Logo & Description */}
					<div className="flex flex-col items-start md:items-center gap-2">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
								<img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
							</div>
							<h1 className={titleClass}>
								Ceylon<span className="text-yellow-400">Roam</span>
							</h1>
						</div>
						<p className={`${bodyTextClass} text-xs md:text-sm`} style={{marginLeft: '3.5rem'}}>
							Explore Sri Lanka's beauty
						</p>
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
						<button
							type="button"
							className={`${linkBaseClass} hover:text-orange-400`}
							style={{font: 'inherit', padding: 0, margin: 0, cursor: 'pointer'}}
							onClick={() => {
								navigate('/privacy-policy', { state: { scrollTo: 'top' } });
							}}
						>
							Privacy
						</button>
						{/* Contact link removed */}
					</div>

					{/* Social Media Icons */}
					<div className="flex justify-center items-center gap-6">
						<a
							href="https://www.linkedin.com/company/ceylon-roam/posts/?feedView=all"
							target="_blank"
							rel="noopener noreferrer"
							className={isDarkMode ? 'text-gray-400 hover:text-yellow-400 transition-colors' : 'text-gray-600 hover:text-yellow-500 transition-colors'}
							aria-label="LinkedIn"
						>
							<FaLinkedin size={20} />
						</a>
						<a
							href="https://www.facebook.com/profile.php?id=61588367554853"
							target="_blank"
							rel="noopener noreferrer"
							className={isDarkMode ? 'text-gray-400 hover:text-blue-400 transition-colors' : 'text-gray-600 hover:text-blue-600 transition-colors'}
							aria-label="Facebook"
						>
							<FaFacebook size={20} />
						</a>
						<a
							href="https://github.com/sigallage/CeylonRoam"
							target="_blank"
							rel="noopener noreferrer"
							className={isDarkMode ? 'text-gray-400 hover:text-gray-200 transition-colors' : 'text-gray-600 hover:text-gray-900 transition-colors'}
							aria-label="GitHub"
						>
							<FaGithub size={20} />
						</a>
						<a
							href="https://youtube.com/@ceylonroam?si=dyO7bwS2-Mm8EtI5"
							target="_blank"
							rel="noopener noreferrer"
							className={isDarkMode ? 'text-gray-400 hover:text-red-500 transition-colors' : 'text-gray-600 hover:text-red-600 transition-colors'}
							aria-label="YouTube"
						>
							<FaYoutube size={20} />
						</a>
						<a
							href="https://www.instagram.com/ceylonroam._?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
							target="_blank"
							rel="noopener noreferrer"
							className={isDarkMode ? 'text-gray-400 hover:text-pink-400 transition-colors' : 'text-gray-600 hover:text-pink-600 transition-colors'}
							aria-label="Instagram"
						>
							<FaInstagram size={20} />
						</a>
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
