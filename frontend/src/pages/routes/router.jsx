
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layout/mainLayout.jsx';
import LoginPage from '../Login/LoginPage.jsx';
import ForgotPassword from '../Login/ForgotPassword.jsx';
import ResetPassword from '../Login/ResetPassword.jsx';
import SignUp from '../signup/signup.jsx';
import LandingPage from '../landingPage/landingPage.jsx';
import RouteOptimizer from '../routeOptimizer/routeOptimizer.jsx';
import VoiceTranslationPage from '../VoiceTranslation/VoiceTranslationPage.jsx';
import ItineraryGenerator from '../itineraryGenerator/itineraryGenerator.jsx';
import Profile from '../Profile/Profile.jsx';
import Main from '../Main/Main.jsx';
import ItineraryHistory from '../ItineraryHistory/ItineraryHistory.jsx';
import AboutUs from '../about/aboutUs.jsx';
import FAQ from '../faq/faq.jsx';
import SplashScreen from '../splashScreen/SplashScreen.jsx';

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
				<Route path="/signup" element={<SignUp />} />
				<Route path="/voice-translation" element={<VoiceTranslationPage />} />
				<Route path="/itinerary-generator" element={<ItineraryGenerator />} />
				<Route path="/main" element={<Main />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/itinerary-history" element={<ItineraryHistory />} />
				<Route path="/about-us" element={<AboutUs />} />
				<Route path="/faq" element={<FAQ />} />
				<Route path="/splash" element={<SplashScreen />} />
			</Route>
		</Routes>
	);
}

export default Router;
