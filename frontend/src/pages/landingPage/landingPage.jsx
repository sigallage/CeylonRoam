import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import flagImage from '../../assets/1.jpg';
import logoIcon from '../../assets/icon.jpeg';
import colomboImage from '../../assets/2.jpg';
import templeImage from '../../assets/3.jpg';
import wildlifeImage from '../../assets/6.jpg';
import sigiriyaImage from '../../assets/4.jpeg';
import beachImage from '../../assets/7.jpg';
import heritageImage from '../../assets/4.jpeg';
import templesImage from '../../assets/5.jpg';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [statsInView, setStatsInView] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [stats, setStats] = useState({
    destinations: 0,
    travelers: 0,
    rating: 0,
    support: 0
  });

  const heroImages = [flagImage, colomboImage, templeImage];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Stats counter animation
  useEffect(() => {
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsInView) {
          setStatsInView(true);
          
          // Animate destinations counter
          const destinationsTarget = 1000;
          const destinationsStep = destinationsTarget / 50;
          let destinationsCurrent = 0;
          const destinationsInterval = setInterval(() => {
            destinationsCurrent += destinationsStep;
            if (destinationsCurrent >= destinationsTarget) {
              setStats(prev => ({ ...prev, destinations: destinationsTarget }));
              clearInterval(destinationsInterval);
            } else {
              setStats(prev => ({ ...prev, destinations: Math.floor(destinationsCurrent) }));
            }
          }, 30);

          // Animate travelers counter
          const travelersTarget = 50000;
          const travelersStep = travelersTarget / 50;
          let travelersCurrent = 0;
          const travelersInterval = setInterval(() => {
            travelersCurrent += travelersStep;
            if (travelersCurrent >= travelersTarget) {
              setStats(prev => ({ ...prev, travelers: travelersTarget }));
              clearInterval(travelersInterval);
            } else {
              setStats(prev => ({ ...prev, travelers: Math.floor(travelersCurrent) }));
            }
          }, 30);

          // Animate rating counter
          const ratingTarget = 4.9;
          const ratingStep = ratingTarget / 50;
          let ratingCurrent = 0;
          const ratingInterval = setInterval(() => {
            ratingCurrent += ratingStep;
            if (ratingCurrent >= ratingTarget) {
              setStats(prev => ({ ...prev, rating: ratingTarget }));
              clearInterval(ratingInterval);
            } else {
              setStats(prev => ({ ...prev, rating: parseFloat(ratingCurrent.toFixed(1)) }));
            }
          }, 30);

          // Support is always 24/7, just set it
          setTimeout(() => setStats(prev => ({ ...prev, support: 24 })), 500);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(statsSection);
    return () => observer.disconnect();
  }, [statsInView]);

  // Scroll animation observer
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, entry.target.id]));
        } else {
          setVisibleSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(entry.target.id);
            return newSet;
          });
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.2,
      rootMargin: '-50px 0px'
    });

    // Observe sections
    const sections = ['features', 'destinations', 'stats-section', 'about'];
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: 'Smart Itinerary Generation',
      description: 'AI-powered itinerary planning that creates perfect day-by-day schedules based on your preferences'
      
    },
    {
      title: 'Route Optimization',
      description: 'Intelligent route planning with live traffic data to save time and fuel on your journey'
      
    },
    {
      title: 'Voice Translation',
      description: 'Real-time Sinhala and Tamil translation to communicate effortlessly with locals'
    }
  ];

  const experiences = [
    {
      name: 'Wildlife Safari',
      description: 'Encounter majestic elephants, leopards, and exotic birds in pristine national parks',
      image: wildlifeImage
    },
    {
      name: 'Ancient Temples',
      description: 'Explore sacred Buddhist temples and UNESCO World Heritage sites steeped in history',
      image: templesImage
    },
    {
      name: 'Pristine Beaches',
      description: 'Relax on golden sandy beaches with crystal-clear turquoise waters',
      image: beachImage
    },
    {
      name: 'World Heritage Sites',
      description: 'Discover 8 UNESCO World Heritage Sites showcasing ancient civilizations',
      image: heritageImage
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section with Image Slider */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Images with Crossfade */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `scale(${1 + scrollY * 0.0002})`
              }}
            />
          ))}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        {/* Navigation */}
        <nav className="relative z-20 flex justify-between items-center px-8 py-6">
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              <img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Ceylon<span className="text-yellow-400">Roam</span>
            </h1>
          </div>
          <div className="hidden md:flex gap-8 text-white font-medium">
            <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
            <a href="#destinations" className="hover:text-amber-400 transition-colors">Experiences</a>
            <a href="#about" className="hover:text-orange-400 transition-colors">About</a>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center px-4">
          <div className="animate-slide-up">
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight">
              Discover the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 animate-gradient">
                Pearl of the Indian Ocean
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              Plan your perfect Sri Lankan adventure with AI-powered route optimization,
              live traffic data, and curated destinations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/planner')}
                className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-lg font-semibold rounded-full shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300"
              >
                Start Planning Your Journey
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-full border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Scroll Indicator with Floating Animation */}
          <div className="absolute bottom-8">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center animate-float">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-scroll" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`relative py-24 px-4 bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden transition-all duration-1000 transform ${
        visibleSections.has('features') 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-16 opacity-0'
      }`}>
        <div className="absolute inset-0 opacity-10">
          <img src={colomboImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h3 className="text-5xl font-bold text-white mb-4">
              Powerful Travel Tools
            </h3>
            <p className="text-xl text-gray-400">
              Advanced features to enhance your journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-700 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
                style={{
                  animation: `fade-in-up 0.6s ease-out ${index * 0.1}s backwards`
                }}
              >
                <div className="absolute inset-0">
                  <img src={feature.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/95 to-gray-900/90" />
                </div>
                <div className="relative z-10 p-8">
                  <h4 className="text-2xl font-bold text-white mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences Showcase */}
      <section id="destinations" className={`relative py-24 px-4 bg-gray-900 overflow-hidden transition-all duration-1000 transform delay-200 ${
        visibleSections.has('destinations') 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-16 opacity-0'
      }`}>
        <div className="absolute inset-0 opacity-15">
          <img src={templeImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold text-white mb-4">
              Experience Sri Lanka
            </h3>
            <p className="text-xl text-gray-400">
              Discover the wonders awaiting you
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {experiences.map((dest, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
                style={{
                  animation: `fade-in-up 0.8s ease-out ${index * 0.2}s backwards`
                }}
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-3xl font-bold text-white mb-2">
                    {dest.name}
                  </h4>
                  <p className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {dest.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className={`relative py-24 px-4 bg-gray-900 overflow-hidden transition-all duration-1000 transform delay-300 ${
        visibleSections.has('stats-section') 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-16 opacity-0'
      }`}>
        <div className="absolute inset-0 opacity-20">
          <img src={flagImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div
              className="animate-fade-in"
              style={{ animationDelay: '0s' }}
            >
              <div className="text-5xl font-bold text-white mb-2">
                {stats.destinations > 0 ? `${stats.destinations}+` : '0'}
              </div>
              <div className="text-xl text-yellow-100">Destinations</div>
            </div>
            <div
              className="animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-5xl font-bold text-white mb-2">
                {stats.travelers > 0 ? `${(stats.travelers / 1000).toFixed(0)}K+` : '0'}
              </div>
              <div className="text-xl text-yellow-100">Happy Travelers</div>
            </div>
            <div
              className="animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="text-5xl font-bold text-white mb-2">
                {stats.rating > 0 ? `${stats.rating}★` : '0'}
              </div>
              <div className="text-xl text-yellow-100">User Rating</div>
            </div>
            <div
              className="animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="text-5xl font-bold text-white mb-2">
                {stats.support > 0 ? `${stats.support}/7` : '0'}
              </div>
              <div className="text-xl text-yellow-100">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className={`relative py-24 px-4 bg-gray-900 overflow-hidden transition-all duration-1000 transform delay-500 ${
        visibleSections.has('about') 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-16 opacity-0'
      }`}>
        <div className="absolute inset-0 opacity-10">
          <img src={colomboImage} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h3 className="text-5xl font-bold text-white mb-6">
            Ready to Start Your Adventure?
          </h3>
          <p className="text-xl text-gray-400 mb-12 leading-relaxed">
            Join thousands of travelers who have discovered the beauty of Sri Lanka
            with our intelligent route planning and real-time navigation
          </p>
          <button
            onClick={() => navigate('/planner')}
            className="group px-12 py-5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-xl font-bold rounded-full shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105 transition-all duration-300"
          >
            Plan Your Journey Now
            <span className="inline-block ml-2 group-hover:translate-x-2 transition-transform">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                <img src={logoIcon} alt="CeylonRoam" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Ceylon<span className="text-yellow-400">Roam</span>
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-wrap justify-center gap-8 text-white font-medium">
              <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
              <a href="#destinations" className="hover:text-amber-400 transition-colors">Experiences</a>
              <a href="#about" className="hover:text-orange-400 transition-colors">About</a>
              <a href="#" className="hover:text-yellow-400 transition-colors">Contact</a>
            </div>

            {/* Contact Info */}
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">info@ceylonroam.lk</p>
              <p className="text-gray-400 text-sm">+94 11 234 5678</p>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">© 2025 CeylonRoam. All rights reserved. Made with love in Sri Lanka</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
