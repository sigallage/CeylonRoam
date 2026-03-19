import { useState } from 'react'
import './App.css'
import Router from './pages/routes/router.jsx'
import SplashScreen from './pages/splashScreen/SplashScreen.jsx'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  return (
    <>
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        <Router />
      )}
    </>
  )
}

export default App
