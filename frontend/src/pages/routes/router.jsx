
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../Login/LoginPage.jsx';
import LandingPage from '../landingPage/landingPage.jsx';
import RouteOptimizer from '../routeOptimizer/routeOptimizer.jsx';

function Router() {
	return (
		<Routes>
			<Route path="/" element={<LandingPage />} />
			<Route path="/planner" element={<RouteOptimizer />} />
			<Route path="/login" element={<LoginPage />} />
			{/* Add other routes here as needed */}
		</Routes>
	);
}

export default Router;
