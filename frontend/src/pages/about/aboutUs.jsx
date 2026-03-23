import React, { useState, useEffect, useRef } from "react";
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

  const scrollDir = useRef('down');
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      scrollDir.current = y > lastY.current ? 'down' : 'up';
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.animate-box');
    if (!els || els.length === 0) return;

    // Give each box an initial entrance direction based on its position
    els.forEach((el, i) => {
      // stagger animations to avoid visual collision when multiple boxes reveal
      el.style.transitionDelay = `${i * 90}ms`;
      const rect = el.getBoundingClientRect();
      if (rect.top > (window.innerHeight || document.documentElement.clientHeight) * 0.6) {
        el.classList.add('from-bottom');
        el.classList.remove('from-top');
      } else {
        el.classList.add('from-top');
        el.classList.remove('from-bottom');
      }
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // When entering viewport, set visible and pick direction based on scroll
          entry.target.classList.add('visible');
          if (scrollDir.current === 'down') {
            entry.target.classList.remove('from-top');
            entry.target.classList.add('from-bottom');
          } else {
            entry.target.classList.remove('from-bottom');
            entry.target.classList.add('from-top');
          }
        } else {
          // Remove visible when leaving so it can animate again on re-entry
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });

    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

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
      <div style={{ position: 'absolute', inset: 0, background: isDarkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.28)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }} />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px", position: 'relative', zIndex: 1 }}>
      <style>{`
        /* Animations disabled: keep boxes static to avoid collisions */
        .animate-box{ opacity:1 !important; transform: none !important; transition: none !important; box-shadow: none !important; filter: none !important; will-change: auto; position: relative; z-index: 0; }
        .animate-box.from-top{ transform: none !important; }
        .animate-box.from-bottom{ transform: none !important; }
        .animate-box.visible{ opacity:1 !important; transform: none !important; box-shadow: none !important; z-index: 0; filter: none !important; }
        .hoverable{ will-change: auto; transition: none !important; }
        .hoverable:hover{ transform: none !important; box-shadow: 0 6px 18px rgba(0,0,0,0.12); }
        .animate-box.visible.hoverable:hover{ transform: none !important; }
        .animate-box ul{ transition: none; }
      `}</style>
      <div
        style={{
        border: '3px solid transparent',
          backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          borderRadius: 16,
            padding: "56px 28px 36px",
            marginTop: 56,
            marginBottom: 48,
        }}
        className="animate-box hoverable"
      >
        <h1 style={{ textAlign: "center", color: '#facc15', marginBottom: 20, fontSize: 48, fontWeight: 800 }}>ABOUT US</h1>
        <p style={{ textAlign: "justify", textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', fontSize: 18, marginBottom: 18 }}>
          <b>CeylonRoam</b> is an AI-powered travel assistant designed to transform how people explore Sri Lanka. Our platform combines advanced artificial intelligence with modern web technologies to provide travelers with a seamless, personalized, and stress-free journey.What sets CeylonRoam apart is our use of advanced AI to generate personalized itineraries, optimize travel routes, and provide real-time voice translation, all in one easy-to-use app. Whether you’re a local adventurer or a first-time visitor, CeylonRoam helps you save time, discover hidden gems, and travel confidently.
        </p>
        <p style={{ textAlign: "justify", textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', fontSize: 18, marginBottom: 18 }}>
          <b>Our mission</b> is to make travel in Sri Lanka smarter, easier, and more memorable by connecting travelers with enriching experiences while supporting sustainable tourism. We believe every journey should be unique, accessible, and filled with discovery.
        </p>
        <p style={{ textAlign: "justify", textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', fontSize: 18, marginBottom: 0 }}>
          Have questions, feedback, or partnership ideas? We’d love to hear from you! Get in touch with us at ceylon.roam144@gmail.com
    and let’s make travel better together. Join us on CeylonRoam and embark on a journey filled with adventure, discovery, and unforgettable memories.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 28, marginBottom: 28, maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="animate-box hoverable" style={{ border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', borderRadius: 12, padding: '14px 20px', maxWidth: 380 }}>
          <h3 style={{ color: '#facc15', marginBottom: 8, fontSize: 26, fontWeight: 800, textAlign: 'center' }}>Why CeylonRoam Matters</h3>
          <p style={{ textAlign: 'justify', textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6, marginBottom: 6 }}>
            Tourism plays a vital role in Sri Lanka's economy, contributing significantly to employment and national income. With over 1.48 million tourists visiting the country in 2023, the industry is rapidly growing.
          </p>
          <p style={{ textAlign: 'justify', textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', marginTop: 8, marginBottom: 8 }}>
            However, travelers still face several challenges:
          </p>
          <ul style={{ color: 'rgba(255,255,255,0.92)', marginLeft: 22, marginBottom: 8, textAlign: 'left' }}>
            <li style={{ marginBottom: 6 }}>• Fragmented and unreliable travel information.</li>
            <li style={{ marginBottom: 6 }}>• Language barriers with local communities.</li>
            <li style={{ marginBottom: 6 }}>• Complex transportation and route planning.</li>
          </ul>
          <p style={{ textAlign: 'justify', textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', marginTop: 8, marginBottom: 4 }}>
            CeylonRoam was created to solve these problems and enhance the overall travel experience.
          </p>
        </div>

        <div className="animate-box hoverable" style={{ border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', borderRadius: 12, padding: '14px 20px', maxWidth: 380 }}>
          <h3 style={{ color: '#facc15', marginBottom: 8, fontSize: 26, fontWeight: 800, textAlign: 'center' }}>Our Vision</h3>
            <p style={{ textAlign: 'justify', textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', lineHeight: 1.6, marginBottom: 6 }}>
            We envision a future where every traveler can explore Sri Lanka with confidence, ease, and personalized guidance powered by AI.
          </p>
            <p style={{ textAlign: 'justify', textJustify: 'inter-word', color: 'rgba(255,255,255,0.92)', marginTop: 8, marginBottom: 4 }}>
            CeylonRoam is more than just a travel app, it's your smart companion for discovering Sri Lanka.
          </p>
        </div>
      </div>

      <div
        className="animate-box hoverable"
        style={{
          marginTop: 72,
          marginBottom: 36,
          border: '3px solid transparent',
          backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          borderRadius: 16,
          padding: "28px 24px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.05)",
          maxWidth: 800,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        <h2 style={{ textAlign: "center", color: '#facc15', fontSize: 28, marginBottom: 18, fontWeight: 800 }}>Founders</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, justifyContent: 'center', listStyle: 'none', padding: 0, maxWidth: 800, margin: '0 auto' }}>
          <li className="hoverable" style={{ textAlign: 'center', border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(122,24,24,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#1f1f1f'; }}>
            <div style={{ background: '#ffb300', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>SG</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>Sasanka Gallage</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li className="hoverable" style={{ textAlign: 'center', border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(33,150,243,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#1f1f1f'; }}>
            <div style={{ background: '#2196f3', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>TF</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>Tashmi Fernando</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li className="hoverable" style={{ textAlign: 'center', border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,195,74,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#1f1f1f'; }}>
            <div style={{ background: '#8bc34a', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>OG</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>Oshadhi Goonewardena</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li className="hoverable" style={{ textAlign: 'center', border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(229,115,115,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#1f1f1f'; }}>
            <div style={{ background: '#e57373', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>RD</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>Rashmika Dewangi</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li className="hoverable" style={{ textAlign: 'center', border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(171,71,188,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#1f1f1f'; }}>
            <div style={{ background: '#ab47bc', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>TP</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>Thamindu Perera</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', border: '3px solid transparent', backgroundImage: 'linear-gradient(#1f1f1f,#1f1f1f), linear-gradient(90deg,#facc15,#ff8a00)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,188,212,0.15)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = '#1f1f1f'; }}>
            <div style={{ background: '#00bcd4', color: '#fff', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>SJ</div>
            <div style={{ fontWeight: 700, marginTop: 10, fontSize: 18, color: 'rgba(255,255,255,0.92)' }}>Sandaru Jayasekara</div>
            <div style={{ color: '#888', marginTop: 4, fontSize: 14 }}>Full-Stack Developer</div>
          </li>
        </ul>
      </div>
      <div style={{ marginTop: 56, display: "flex", justifyContent: "center" }}>
        <div style={{ width: '100%', maxWidth: 960, height: 90, borderRadius: 12, background: 'linear-gradient(90deg,#facc15,#ff8a00)', boxShadow: '0 6px 28px rgba(0,0,0,0.18)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#111', marginBottom: 6 }}>CONTACT US</div>
          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=ceylon.roam144@gmail.com" target="_blank" rel="noopener noreferrer" style={{ color: '#111', textDecoration: 'underline', fontSize: 16 }}>ceylon.roam144@gmail.com</a>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AboutUs;
