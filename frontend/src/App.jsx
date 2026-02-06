import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landingPage/landingPage.jsx'
import RouteOptimizer from './pages/routeOptimizer/routeOptimizer.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/planner" element={<RouteOptimizer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
