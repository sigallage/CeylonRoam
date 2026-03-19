import { useEffect } from 'react';
import Lottie from 'lottie-react';
import splashAnimation from '../../assets/splash-animation.json';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-blue-950 flex items-center justify-center z-[9999] relative overflow-hidden">
      {/* Additional gradient overlay for more depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/50 via-transparent to-gray-800/30"></div>
      
      <div className="relative text-center z-10">
        {/* Lottie Animation */}
        <div className="relative mb-6 flex items-center justify-center">
          <Lottie 
            animationData={splashAnimation} 
            loop={true}
            className="w-56 h-56 md:w-64 md:h-64 animate-[fadeIn_0.8s_ease-out]"
          />
        </div>
        
        {/* Title with gradient matching landing page */}
        <div className="space-y-4 animate-[fadeInUp_1s_ease-out_0.3s_both]">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-2">
            Ceylon<span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 bg-clip-text text-transparent">Roam</span>
          </h1>
          
          {/* Subtitle with golden theme */}
          <p className="text-lg md:text-xl text-gray-300 font-light tracking-[0.25em] uppercase">
            Explore Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
