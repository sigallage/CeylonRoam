import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const PrivacyPolicy = () => {
	const location = useLocation();
	const { isDarkMode } = useTheme();

	useEffect(() => {
		if (location.state && location.state.scrollTo === 'top') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			window.scrollTo({ top: 0 });
		}
	}, [location]);

	const pageClass = isDarkMode ? 'min-h-screen bg-black text-white' : 'min-h-screen bg-white text-gray-900';
	const cardClass = isDarkMode
		? 'max-w-4xl mx-auto px-6 py-12'
		: 'max-w-4xl mx-auto px-6 py-12';
	const mutedClass = isDarkMode ? 'text-gray-300' : 'text-gray-700';
	const headingClass = isDarkMode ? 'text-white' : 'text-gray-900';
	const sectionTitleClass = isDarkMode ? 'text-white' : 'text-gray-900';
	const linkClass = isDarkMode ? 'text-yellow-400 underline' : 'text-amber-600 underline';

	return (
		<div className={pageClass}>
			<div className={cardClass}>
				<h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${headingClass}`}>
					Privacy Policy
				</h1>
				<p className={`mt-2 text-sm ${mutedClass}`}>Effective date: March 28, 2026</p>

				<p className={`mt-6 leading-7 ${mutedClass}`}>
					This Privacy Policy explains how CeylonRoam collects, uses, and protects your information when you use
					 our app.
				</p>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>What we collect</h2>
				<ul className={`mt-4 list-disc pl-5 space-y-3 ${mutedClass}`}>
					<li>
						<b>Location data</b>: used to support route planning and travel features. Location can be collected
						 from your device when you grant location permission, and may be sent to our servers to calculate
						 routes you request.
					</li>
					<li>
						<b>Microphone/audio input</b>: used to support voice translation features. Audio is captured only
						 when you actively use voice translation and grant microphone permission. The audio you submit is
						 uploaded to our server for transcription/processing and is stored only temporarily to complete
						 the request.
					</li>
					<li>
						<b>Account information</b>: if you create an account, we may collect basic details such as your
						 name and email address for authentication and account management.
					</li>
				</ul>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>How we use your information</h2>
				<ul className={`mt-4 list-disc pl-5 space-y-3 ${mutedClass}`}>
					<li>Provide and improve app features (route planning, itinerary tools, and voice translation).</li>
					<li>Authenticate you and keep your account secure.</li>
					<li>Respond to support requests and improve reliability.</li>
				</ul>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Permissions and your choices</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					You can control permissions in your device settings:
				</p>
				<ul className={`mt-4 list-disc pl-5 space-y-3 ${mutedClass}`}>
					<li>
						<b>Location</b>: you can allow or deny location access. Some route-related features may not work
						 without it.
					</li>
					<li>
						<b>Microphone</b>: you can allow or deny microphone access. Voice translation will not work
						 without it.
					</li>
				</ul>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Sharing</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					We do not sell your personal information. We may share limited information only when necessary to
					 provide the service (for example, calling external APIs you request through the app) or when
					 required by law.
				</p>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Data retention</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					We keep information only as long as needed to provide the app and for legitimate operational
					 purposes. You can request deletion of your account data by contacting us.
				</p>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Security</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					We use reasonable safeguards to protect information. No method of transmission or storage is 100%
					 secure.
				</p>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Children’s privacy</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					CeylonRoam is not intended for children under 13, and we do not knowingly collect personal
					 information from children.
				</p>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Contact us</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					If you have questions or requests about this Privacy Policy, contact us at{' '}
					<a className={linkClass} href="mailto:ceylon.roam144@gmail.com">
						ceylon.roam144@gmail.com
					</a>
					.
				</p>

				<h2 className={`mt-10 text-2xl font-semibold ${sectionTitleClass}`}>Changes to this policy</h2>
				<p className={`mt-4 leading-7 ${mutedClass}`}>
					We may update this Privacy Policy from time to time. We will update the effective date above when
					 changes are made.
				</p>
			</div>
		</div>
	);
};

export default PrivacyPolicy;
