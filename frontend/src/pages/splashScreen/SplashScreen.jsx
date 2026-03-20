import { useEffect } from 'react';
import Lottie from 'lottie-react';
import splashAnimation from '../../assets/splash-animation.json';
import appIcon from '../../assets/icon.jpeg';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[linear-gradient(102deg,#01030a_0%,#030b22_58%,#050f2a_80%,#5a2d00_100%)] flex items-center justify-center z-[9999] overflow-hidden">
      {/* Additional gradient overlay for more depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#02091f]/78 via-[#071633]/14 to-transparent"></div>
      <div className="absolute inset-y-0 right-0 w-[32%] bg-gradient-to-l from-[#7a3d00]/64 via-[#5a2d00]/42 to-transparent"></div>
      <div className="absolute inset-y-0 left-0 w-[32%] bg-gradient-to-r from-[#7a3d00]/64 via-[#5a2d00]/42 to-transparent"></div>
      
      <div className="relative text-center z-10">
        {/* Lottie Animation */}
        <div className="relative mb-6 flex items-center justify-center">
          <Lottie 
            animationData={splashAnimation} 
            loop={true}
            className="w-48 h-48 md:w-56 md:h-56 animate-[fadeIn_0.8s_ease-out]"
          />
          <div className="absolute w-20 h-20 md:w-24 md:h-24 rounded-full bg-orange-500/20 blur-md animate-[pulse_3.6s_ease-in-out_infinite]"></div>
          <img
            src={appIcon}
            alt="CeylonRoam icon"
            className="absolute w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-white/30 shadow-[0_0_24px_rgba(255,255,255,0.16)] animate-[pulse_3.6s_ease-in-out_infinite]"
          />
        </div>
        
        {/* Title with gradient matching landing page */}
        <div className="space-y-3 animate-[fadeInUp_1s_ease-out_0.3s_both]">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-1">
            Ceylon<span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">Roam</span>
          </h1>
          
          {/* Subtitle with golden theme */}
          <p className="text-base md:text-lg text-gray-300 font-light tracking-[0.22em] uppercase">
            Explore Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
