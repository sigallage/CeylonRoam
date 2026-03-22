import React, { useMemo, useState, useEffect } from "react";
import bgImg from '../../assets/2.jpg';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const AboutUs = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  useEffect(() => {
    if (location.state && location.state.scrollTo === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);
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
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: isDarkMode ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px", position: 'relative', zIndex: 1 }}>
      <div
        style={{
          background: isDarkMode ? "#1f1f1f" : "#ececec",
          border: isDarkMode ? "1px solid rgba(250, 204, 21, 0.25)" : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: 16,
          padding: "20px 16px",
          marginBottom: 30,
        }}
      >
        <h1 style={{ textAlign: "center", color: isDarkMode ? "#facc15" : "#7a1818", marginBottom: 20, fontSize: 40 }}>ABOUT US</h1>
        <p style={{ textAlign: "center", color: isDarkMode ? "rgba(255,255,255,0.85)" : "#1f2937", fontSize: 18, marginBottom: 30 }}>
          <b>CeylonRoam</b> is an AI-powered travel assistant designed to transform how people explore Sri Lanka. Our platform combines advanced artificial intelligence with modern web technologies to provide travelers with a seamless, personalized, and stress-free journey.What sets CeylonRoam apart is our use of advanced AI to generate personalized itineraries, optimize travel routes, and provide real-time voice translation — all in one easy-to-use app. Whether you’re a local adventurer or a first-time visitor, CeylonRoam helps you save time, discover hidden gems, and travel confidently.
        </p>
        <p style={{ textAlign: "center", color: isDarkMode ? "rgba(255,255,255,0.85)" : "#1f2937", fontSize: 18, marginBottom: 30 }}>
          <b>Our mission</b> is to make travel in Sri Lanka smarter, easier, and more memorable by connecting travelers with enriching experiences while supporting sustainable tourism. We believe every journey should be unique, accessible, and filled with discovery.
        </p>
        <p style={{ textAlign: "center", color: isDarkMode ? "rgba(255,255,255,0.85)" : "#1f2937", fontSize: 18, marginBottom: 0 }}>
          Have questions, feedback, or partnership ideas? We’d love to hear from you! Get in touch with us at ceylon.roam144@gmail.com
    and let’s make travel better together. Join us on CeylonRoam and embark on a journey filled with adventure, discovery, and unforgettable memories.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16, marginBottom: 16, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ background: isDarkMode ? '#111' : '#111', border: isDarkMode ? '1px solid rgba(250, 204, 21, 0.25)' : '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 12, padding: '16px', maxWidth: 420 }}>
          <h3 style={{ color: isDarkMode ? '#facc15' : '#7a1818', marginBottom: 10, fontSize: 20 }}>Why CeylonRoam Matters</h3>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#1f2937', lineHeight: 1.7 }}>
            Tourism plays a vital role in Sri Lanka's economy, contributing significantly to employment and national income. With over 1.48 million tourists visiting the country in 2023, the industry is rapidly growing.
          </p>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#1f2937', marginTop: 8 }}>
            However, travelers still face several challenges:
          </p>
          <ul style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#1f2937', marginLeft: 20 }}>
            <li>Fragmented and unreliable travel information</li>
            <li>Language barriers with local communities</li>
            <li>Complex transportation and route planning</li>
          </ul>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#1f2937', marginTop: 8 }}>
            CeylonRoam was created to solve these problems and enhance the overall travel experience.
          </p>
        </div>

        <div style={{ background: isDarkMode ? '#111' : '#111', border: isDarkMode ? '1px solid rgba(250, 204, 21, 0.25)' : '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 12, padding: '16px', maxWidth: 420 }}>
          <h3 style={{ color: isDarkMode ? '#facc15' : '#7a1818', marginBottom: 10, fontSize: 20 }}>Our Vision</h3>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#1f2937', lineHeight: 1.7 }}>
            We envision a future where every traveler can explore Sri Lanka with confidence, ease, and personalized guidance powered by AI.
          </p>
          <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : '#1f2937', marginTop: 8 }}>
            CeylonRoam is more than just a travel app, it's your smart companion for discovering Sri Lanka.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          marginBottom: 24,
          background: isDarkMode ? "#1f1f1f" : "#ececec",
          border: isDarkMode ? "1px solid rgba(250, 204, 21, 0.25)" : "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: 16,
          padding: "20px 16px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2 style={{ textAlign: "center", color: isDarkMode ? "#facc15" : "#7a1818", fontSize: 24, marginBottom: 18 }}>Founders</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, justifyContent: 'center', listStyle: 'none', padding: 0, maxWidth: 900, margin: '0 auto' }}>
          <li style={{ textAlign: 'center', background: '#ececec', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(122,24,24,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ececec'; }}>
            <div style={{ background: '#ffb300', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>SG</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 16 }}>Sasanka Gallage</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#ececec', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(33,150,243,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ececec'; }}>
            <div style={{ background: '#2196f3', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>TF</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 16 }}>Tashmi Fernando</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#ececec', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,195,74,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ececec'; }}>
            <div style={{ background: '#8bc34a', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>OG</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 16 }}>Oshadhi Goonewardena</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#ececec', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(229,115,115,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ececec'; }}>
            <div style={{ background: '#e57373', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>RD</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Rashmika Dewangi</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#ececec', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(171,71,188,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ececec'; }}>
            <div style={{ background: '#ab47bc', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>TP</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Thamindu Perera</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#ececec', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,188,212,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#ececec'; }}>
            <div style={{ background: '#00bcd4', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>SJ</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Sandaru Jayasekara</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
        </ul>
      </div>
      <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", borderRadius: 16, padding: "20px 16px", maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 24 }}>
            {/* Icon removed */}
          </div>
          <h2 style={{ textAlign: "center", color: "#222", marginBottom: 20, fontSize: 22, fontWeight: 700 }}>Contact Us</h2>
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
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#ffe066] via-[#ffc233] to-[#ff6a00] text-black py-3 font-bold tracking-wide text-lg rounded-full shadow-md flex items-center justify-center disabled:opacity-70"
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
