import React, { useState } from "react";

const AboutUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "", rating: 0 });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRating = (rating) => {
    setForm({ ...form, rating });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Add logic to send form data to backend or email service if needed
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
                  onClick={() => setForm({ ...form, rating: star })}
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
                justifyContent: "center"
              }}
            >
              Send
            </button>
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
