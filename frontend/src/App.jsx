/*import './App.css'
import RouteOptimizer from './pages/routeOptimizer/routeOptimizer.jsx'

function App() {
  return <RouteOptimizer />
}

export default App */

import './App.css';
import { Navigate, Route, Routes } from "react-router-dom";
import Main from "./pages/Main/Main";
import ItineraryGenerator from "./pages/itineraryGenerator/itineraryGenerator.jsx";
//import Splash from "./pages/Splash/Splash.jsx";
import RouteOptimizer from './pages/routeOptimizer/routeOptimizer.jsx';

const App = () => (
  <Routes>
    <Route path="/" element={<ItineraryGenerator />} />
    <Route path="/main" element={<Main />} />
    {/* <Route path="/splash" element={<Splash />} /> */}
    <Route path="/route-optimizer" element={<RouteOptimizer />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
