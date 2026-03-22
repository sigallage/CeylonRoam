import React, { useMemo, useState, useEffect } from "react";
import bgImg from '../../assets/2.jpg';
import { useLocation } from 'react-router-dom';

const AboutUs = () => {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (document.documentElement.classList.contains('dark')) return true;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', handler);
      else mq.addListener(handler);
    }
    return () => {
      if (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', handler);
        else mq.removeListener(handler);
      }
    };
  }, []);
  useEffect(() => {
    if (location.state && location.state.scrollTo === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
        else entry.target.classList.remove('visible');
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    const els = document.querySelectorAll('.reveal-card, .reveal-item');
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const [form, setForm] = useState({ name: "", email: "", message: "", rating: 0 });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const authBaseUrl = useMemo(
    () => import.meta.env.VITE_AUTH_URL?.replace(/\/$/, "") || "http://localhost:5001",
    []
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRating = (rating) => {
    setForm({ ...form, rating });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitted(false);
    setIsSubmitting(true);

    try {
      const subject = encodeURIComponent(`Contact Us - ${form.name}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nRating: ${form.rating || "Not provided"}\n\nMessage:\n${form.message}`
      );

      const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=ceylon.roam144@gmail.com&su=${subject}&body=${body}`;
      window.location.href = gmailComposeUrl;

      setSubmitted(true);
      setForm({ name: "", email: "", message: "", rating: 0 });
    } catch (error) {
      setSubmitError("Could not open your email app. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background image layer (blurred) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(6px) brightness(0.8) contrast(1)',
        transform: 'scale(1.03)',
        zIndex: 0
      }} />

      {/* Overlay to tint the image differently for dark/light mode */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isDarkMode ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.12)',
        backdropFilter: isDarkMode ? 'blur(2px)' : 'blur(1px)',
        WebkitBackdropFilter: isDarkMode ? 'blur(2px)' : 'blur(1px)',
        zIndex: 0
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px", position: 'relative', zIndex: 1 }}>
      <div className="reveal-card"
        style={{
          background: isDarkMode ? "linear-gradient(#111,#111) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box" : "linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box",
          border: "4px solid transparent",
          borderRadius: 18,
          padding: "44px 24px 28px",
          marginTop: 12,
          marginBottom: 56,
          maxWidth: 880,
          margin: '0 auto',
          transitionDelay: '0ms'
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 36, fontSize: 42, background: 'linear-gradient(90deg,#facc15,#ff6a00)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>ABOUT US</h1>
        <p style={{ textAlign: "justify", color: isDarkMode ? "rgba(255,255,255,0.9)" : "#1f2937", fontSize: 16, marginBottom: 20, lineHeight: 1.7 }}>
          <b>CeylonRoam</b> is an AI-powered travel assistant designed to transform how people explore Sri Lanka. Our platform combines advanced artificial intelligence with modern web technologies to provide travelers with a seamless, personalized, and stress-free journey. What sets CeylonRoam apart is our use of advanced AI to generate personalized itineraries, optimize travel routes, and provide real-time voice translation, all in one easy-to-use app. Whether you’re a local adventurer or a first-time visitor, CeylonRoam helps you save time, discover hidden gems, and travel confidently.
        </p>
        <p style={{ textAlign: "justify", color: isDarkMode ? "rgba(255,255,255,0.9)" : "#1f2937", fontSize: 16, marginBottom: 20, lineHeight: 1.7 }}>
          <b>Our mission</b> is to make travel in Sri Lanka smarter and more accessible, helping travelers discover meaningful experiences while supporting sustainable tourism. We believe every journey should be unique, accessible, and filled with discovery.
        </p>
        <p style={{ textAlign: "justify", color: isDarkMode ? "rgba(255,255,255,0.9)" : "#1f2937", fontSize: 16, marginBottom: 0, lineHeight: 1.6 }}>
          Have questions, feedback, or partnership ideas? We’d love to hear from you! Get in touch with us at ceylon.roam144@gmail.com and let’s make travel better together. Join us on CeylonRoam and embark on a journey filled with adventure, discovery, and unforgettable memories.
        </p>
      </div>
      {/* Reveal boxes: Why it matters / Our Vision */}
      <style>{`
        .reveal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:28px;max-width:880px;margin:18px auto 40px;}
        .reveal-card,.reveal-item{opacity:0;transform:translateY(22px) scale(0.99);transition:opacity 600ms ease, transform 300ms cubic-bezier(0.2,0.9,0.3,1), box-shadow 300ms ease;border-radius:12px;padding:20px;min-height:170px;border:2px solid transparent;background-clip:padding-box, border-box;background-origin:padding-box, border-box;}
        .reveal-card.visible,.reveal-item.visible{opacity:1;transform:translateY(0) scale(1);} 
        .reveal-card h3{margin:0 0 10px 0;font-size:20px}
        .reveal-card.visible:hover, .reveal-item.visible:hover{transform:translateY(-6px) scale(1.03);box-shadow:0 16px 40px rgba(0,0,0,0.18);cursor:pointer}
      `}</style>

      <div className="reveal-grid">
        <div className="reveal-card" style={{
          background: isDarkMode ? 'linear-gradient(#0f0f0f,#0f0f0f) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box' : 'linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box',
          borderRadius: 20,
          border: '2px solid transparent',
          boxShadow: isDarkMode ? 'none' : '0 6px 18px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ background: 'linear-gradient(90deg,#facc15,#ff6a00)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Why CeylonRoam Matters</h3>
          <p style={{ textAlign: 'justify', color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#111', lineHeight: 1.7 }}>
            Tourism plays a vital role in Sri Lanka's economy, contributing significantly to employment and national income. With over 1.48 million tourists visiting the country in 2023, the industry is rapidly growing.
          </p>
          <p style={{ textAlign: 'justify', color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#111', lineHeight: 1.7, marginTop: 12 }}>
            However, travelers still face several challenges:
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>Fragmented and unreliable travel information</li>
              <li>Language barriers with local communities</li>
              <li>Complex transportation and route planning</li>
            </ul>
          </p>
          <p style={{ textAlign: 'justify', color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#111', marginTop: 12 }}>
            CeylonRoam was created to solve these problems and enhance the overall travel experience.
          </p>
        </div>

        <div className="reveal-card" style={{
          background: isDarkMode ? 'linear-gradient(#0f0f0f,#0f0f0f) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box' : 'linear-gradient(#ffffff,#ffffff) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box',
          borderRadius: 20,
          border: '2px solid transparent',
          boxShadow: isDarkMode ? 'none' : '0 6px 18px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ background: 'linear-gradient(90deg,#facc15,#ff6a00)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Our Vision</h3>
          <p style={{ textAlign: 'justify', color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#111', lineHeight: 1.7 }}>
            We envision a future where every traveler can explore Sri Lanka with confidence, ease, and personalized guidance powered by AI.
          </p>
          <p style={{ textAlign: 'justify', color: isDarkMode ? 'rgba(255,255,255,0.9)' : '#111', marginTop: 12 }}>
            CeylonRoam is more than just a travel app, it’s your smart companion for discovering Sri Lanka.
          </p>
        </div>
      </div>

      <div className="reveal-card founders-panel"
        style={{
          marginTop: 40,
          marginBottom: 32,
          background: isDarkMode ? "linear-gradient(#111,#111) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box" : "linear-gradient(#fff,#fff) padding-box, linear-gradient(90deg,#facc15,#ff6a00) border-box",
          border: "4px solid transparent",
          borderRadius: 12,
          padding: "20px 18px",
          maxWidth: 880,
          marginLeft: 'auto',
          marginRight: 'auto',
          minHeight: 180,
        }}
      >
        <h2 style={{ textAlign: "center", fontSize: 24, marginBottom: 12, background: 'linear-gradient(90deg,#facc15,#ff6a00)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Founders</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, justifyContent: 'center', listStyle: 'none', padding: 0, maxWidth: 880, margin: '0 auto' }}>
          {[
            { initials: 'SG', name: 'Sasanka Gallage', color: '#ffb300' },
            { initials: 'TF', name: 'Tashmi Fernando', color: '#2196f3' },
            { initials: 'OG', name: 'Oshadhi Goonewardena', color: '#8bc34a' },
            { initials: 'RD', name: 'Rashmika Dewangi', color: '#e57373' },
            { initials: 'TP', name: 'Thamindu Perera', color: '#ab47bc' },
            { initials: 'SJ', name: 'Sandaru Jayasekara', color: '#00bcd4' },
          ].map((person, idx) => (
            <li key={person.initials} className="reveal-item" style={{ textAlign: 'center', background: isDarkMode ? 'transparent' : '#ececec', boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 10, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s', border: isDarkMode ? '2px solid transparent' : 'none', backgroundClip: isDarkMode ? 'padding-box' : 'none', transitionDelay: `${idx * 80}ms` }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; }}>
              <div style={{ background: person.color, color: '#fff', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, boxShadow: isDarkMode ? '0 6px 18px rgba(0,0,0,0.6)' : 'none' }}>{person.initials}</div>
              <div style={{ fontWeight: 700, marginTop: 8, fontSize: 15, color: isDarkMode ? 'rgba(255,255,255,0.95)' : '#111' }}>{person.name}</div>
              <div style={{ color: isDarkMode ? 'rgba(255,255,255,0.6)' : '#888', marginTop: 4 }}>Full-Stack Developer</div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 60, display: "flex", justifyContent: "center" }}>
        <div className="reveal-card" style={{ background: 'linear-gradient(#111,#111) padding-box, linear-gradient(90deg,#ffe066,#ffc233) border-box', boxShadow: isDarkMode ? '0 20px 40px rgba(250,150,0,0.06)' : '0 4px 24px rgba(0,0,0,0.08)', borderRadius: 16, padding: "26px 22px", maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", border: '4px solid transparent', transitionDelay: '220ms' }}>
          <div style={{ marginBottom: 24 }}>
            {/* Icon removed */}
          </div>
          <h2 style={{ textAlign: "center", marginBottom: 34, fontSize: 28, fontWeight: 700, background: 'linear-gradient(90deg,#facc15,#ff6a00)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Contact Us</h2>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Full Name"
              style={{ width: "100%", padding: "12px 16px", fontSize: 16, marginBottom: 16, border: "1px solid #eee", borderRadius: 8, outline: "none", background: "#f5f5f5" }}
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Email Address"
              style={{ width: "100%", padding: "12px 16px", fontSize: 16, marginBottom: 16, border: "1px solid #eee", borderRadius: 8, outline: "none", background: "#f5f5f5" }}
            />
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={3}
              placeholder="Your Message"
              style={{ width: "100%", padding: "12px 16px", fontSize: 16, marginBottom: 16, border: "1px solid #eee", borderRadius: 8, outline: "none", background: "#f5f5f5" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              {[1,2,3,4,5].map(star => (
                <span
                  key={star}
                  className="cursor-pointer rounded-lg px-3 py-1 border border-transparent inline-block bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box] hover:bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffef9e_0%,#ffd76a_45%,#ff8a2b_100%)]"
                  onClick={() => handleRating(star)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    className="w-8 h-8 block"
                    viewBox="0 0 24 24"
                    fill={star <= form.rating ? "#ffb300" : "#ccc"}
                    stroke="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <polygon points="12,2 15,9 22,9 17,14 18,21 12,17 6,21 7,14 2,9 9,9" />
                  </svg>
                </span>
              ))}
            </div>
            <button
              type="submit"
              aria-label="Send feedback"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '14px 18px', borderRadius: 999, fontWeight: 800, fontSize: 16, color: '#111', background: 'linear-gradient(90deg,#ffe066,#ffc233,#ff6a00)', boxShadow: isDarkMode ? '0 12px 30px rgba(255,180,50,0.14), 0 0 18px rgba(255,160,40,0.06)' : '0 6px 20px rgba(0,0,0,0.08)' }}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
            {submitError && (
              <p className="text-center text-red-700 mt-5">{submitError}</p>
            )}
            {submitted && (
              <p className="text-center text-green-600 mt-5">Thank you for your feedback!</p>
            )}
          </form>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AboutUs;
