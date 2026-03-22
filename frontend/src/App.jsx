import { useState } from 'react'
import './App.css'
import Router from './pages/routes/router.jsx'
import SplashScreen from './pages/splashScreen/SplashScreen.jsx'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashFinish = () => {
    setShowSplash(false)
  }

  return (
    <ThemeProvider>
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        <Router />
      )}
    </ThemeProvider>
  )
}

export default App
