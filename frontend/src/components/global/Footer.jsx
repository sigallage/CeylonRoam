import logoIcon from '../../assets/icon.jpeg';

const Footer = () => {
	return (
		<footer className="relative py-8 px-8 bg-black">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row justify-between items-center gap-8">
					{/* Logo */}
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
							<img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
						</div>
						<h1 className="text-3xl font-bold text-white tracking-tight">
							Ceylon<span className="text-yellow-400">Roam</span>
						</h1>
					</div>

					{/* Navigation Links */}
					<div className="flex flex-wrap justify-center gap-8 text-white font-medium">
						<a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
						<a href="#destinations" className="hover:text-amber-400 transition-colors">Experiences</a>
						<a href="#about" className="hover:text-orange-400 transition-colors">About</a>
						<a href="#" className="hover:text-yellow-400 transition-colors">Contact</a>
					</div>

					{/* Contact Info */}
					<div className="text-center md:text-right">
						<p className="text-gray-400 text-sm">info@ceylonroam.lk</p>
						<p className="text-gray-400 text-sm">+94 11 234 5678</p>
					</div>
				</div>

				{/* Bottom Copyright */}
				<div className="mt-8 pt-6 border-t border-gray-800 text-center">
					<p className="text-gray-400 text-sm">© 2025 CeylonRoam. All rights reserved. Made with love in Sri Lanka</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
