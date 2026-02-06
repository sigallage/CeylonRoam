import './App.css'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landingPage/landingPage.jsx'
import RouteOptimizer from './pages/routeOptimizer/routeOptimizer.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/planner" element={<RouteOptimizer />} />
    </Routes>
  )
}

export default App;
