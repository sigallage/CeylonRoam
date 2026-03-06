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
        <div style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", borderRadius: 40, padding: "16px 24px", maxWidth: 700, width: "100%", height: "auto", minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ textAlign: "center", color: "#7a1818", marginBottom: 30, fontSize: 28 }}>Contact Us</h2>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div style={{ display: "flex", gap: 20, marginBottom: 40 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <label style={{ letterSpacing: 3, color: "#7a1818", fontWeight: 500 }}>NAME</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  style={{ flex: 1, width: "100%", padding: 15, fontSize: 18, marginTop: 5, marginBottom: 0, border: "1px solid #eee", outline: "none", borderRadius: 16 }}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <label style={{ letterSpacing: 3, color: "#7a1818", fontWeight: 500 }}>EMAIL</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{ flex: 1, width: "100%", padding: 15, fontSize: 18, marginTop: 5, marginBottom: 0, border: "1px solid #eee", outline: "none", borderRadius: 16 }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 30 }}>
              <label style={{ letterSpacing: 3, color: "#7a1818", fontWeight: 500 }}>MESSAGE</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                style={{ width: "100%", padding: 15, fontSize: 18, marginTop: 5, border: "1px solid #eee", outline: "none", borderRadius: 16 }}
              />
            </div>
            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                style={{ background: "#111", color: "#fff", padding: "10px 24px", fontWeight: 700, letterSpacing: 3, fontSize: 16, border: "none", cursor: "pointer", borderRadius: 16 }}
              >
                SEND
              </button>
            </div>
            {submitted && (
              <p style={{ textAlign: "center", color: "green", marginTop: 20 }}>Thank you for contacting us!</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
