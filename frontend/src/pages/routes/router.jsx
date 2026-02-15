
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layout/mainLayout.jsx';
import LoginPage from '../Login/LoginPage.jsx';
import ForgotPassword from '../Login/ForgotPassword.jsx';
import ResetPassword from '../Login/ResetPassword.jsx';
import SignUpPage from '../Login/SignUpPage.jsx';
import LandingPage from '../landingPage/landingPage.jsx';
import RouteOptimizer from '../routeOptimizer/routeOptimizer.jsx';
import VoiceTranslationPage from '../VoiceTranslation/VoiceTranslationPage.jsx';

function Router() {
	return (
		<Routes>
			{/* Landing page without header/footer */}
			<Route path="/" element={<LandingPage />} />
			
			{/* All other pages with header/footer */}
			<Route element={<MainLayout />}>
				<Route path="/planner" element={<RouteOptimizer />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/reset-password" element={<ResetPassword />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/signup" element={<SignUpPage />} />
				<Route path="/voice-translation" element={<VoiceTranslationPage />} />
			</Route>
		</Routes>
	);
}

export default Router;
