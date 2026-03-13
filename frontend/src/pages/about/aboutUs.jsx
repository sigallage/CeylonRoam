import React, { useMemo, useState } from "react";

const AboutUs = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitted(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${authBaseUrl}/api/contact-us`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          rating: form.rating,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        const message = typeof payload === "string"
          ? payload
          : payload?.message || "Failed to send feedback. Please try again.";
        setSubmitError(message);
        return;
      }

      setSubmitted(true);
      setForm({ name: "", email: "", message: "", rating: 0 });
    } catch (error) {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ textAlign: "center", color: "#7a1818", marginBottom: 30, fontSize: 48 }}>About Us</h1>
      <p style={{ textAlign: "center", fontSize: 18, marginBottom: 30 }}>
        <b>CeylonRoam</b> is an innovative travel companion app created by a passionate team of travel enthusiasts, technologists, and local experts. Our mission is to make travel in Sri Lanka smarter, easier, and more memorable by connecting travelers with enriching experiences and supporting sustainable tourism. We believe every journey should be unique, accessible, and filled with discovery.
      </p>
      <p style={{ textAlign: "center", fontSize: 18, marginBottom: 30 }}>
        What sets CeylonRoam apart is our use of advanced AI to generate personalized itineraries, optimize travel routes, and provide real-time voice translation, all in one easy-to-use app. Whether you’re a local adventurer or a first-time visitor, CeylonRoam helps you save time, discover hidden gems, and travel confidently. Our team combines technical expertise with a deep appreciation for Sri Lanka’s culture, nature, and people, striving to make every traveler’s experience extraordinary.
      </p>
      <p style={{ textAlign: "center", fontSize: 18, marginBottom: 50 }}>
        Have questions, feedback, or partnership ideas? We’d love to hear from you! Get in touch with us at <a href="mailto:info@ceylonroam.lk" style={{ color: "#7a1818", textDecoration: "underline" }}>ceylon.roam144@gmail.com</a> and let’s make travel better together. Join us on CeylonRoam and embark on a journey filled with adventure, discovery, and unforgettable memories.
      </p>
      <div style={{ marginTop: 40, marginBottom: 40 }}>
        <h2 style={{ textAlign: "center", color: "#7a1818", fontSize: 28, marginBottom: 24 }}>Founders</h2>
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, justifyContent: 'center', listStyle: 'none', padding: 0, maxWidth: 900, margin: '0 auto' }}>
          <li style={{ textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(122,24,24,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ background: '#ffb300', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>SG</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Sasanka Gallage</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(33,150,243,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ background: '#2196f3', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>TF</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Tashmi Fernando</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(139,195,74,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ background: '#8bc34a', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>OG</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Oshadhi Goonewardena</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(229,115,115,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ background: '#e57373', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>RD</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Rashmika Dewangi</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(171,71,188,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ background: '#ab47bc', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>TP</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Thamindu Perera</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
          <li style={{ textAlign: 'center', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,188,212,0.15)'; e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)'; }}
            onMouseOut={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ background: '#00bcd4', color: '#fff', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>SJ</div>
            <div style={{ fontWeight: 700, marginTop: 12, fontSize: 18 }}>Sandaru Jayasekara</div>
            <div style={{ color: '#888', marginTop: 4 }}>Full-Stack Developer</div>
          </li>
        </ul>
      </div>
      <div style={{ marginTop: 60, display: "flex", justifyContent: "center" }}>
        <div style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", borderRadius: 24, padding: "32px 24px", maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 24 }}>
            {/* Icon removed as requested */}
          </div>
          <h2 style={{ textAlign: "center", color: "#222", marginBottom: 34, fontSize: 28, fontWeight: 700 }}>Contact Us</h2>
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
                  style={{
                    cursor: "pointer",
                    background: "#fff",
                    borderRadius: 8,
                    padding: "4px 12px",
                    border: "1px solid #eee",
                    transition: "border 0.2s, background 0.2s",
                    display: "inline-block"
                  }}
                  onClick={() => handleRating(star)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={star <= form.rating ? "#ffb300" : "#ccc"}
                    stroke="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: "block" }}
                  >
                    <polygon points="12,2 15,9 22,9 17,14 18,21 12,17 6,21 7,14 2,9 9,9" />
                  </svg>
                </span>
              ))}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                background: "#111",
                color: "#fff",
                padding: "12px 0",
                fontWeight: 700,
                letterSpacing: 1,
                fontSize: 18,
                border: "none",
                cursor: "pointer",
                borderRadius: 40,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "Sending..." : "Send"}
            </button>
            {submitError && (
              <p style={{ textAlign: "center", color: "#b91c1c", marginTop: 20 }}>{submitError}</p>
            )}
            {submitted && (
              <p style={{ textAlign: "center", color: "green", marginTop: 20 }}>Thank you for your feedback!</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
