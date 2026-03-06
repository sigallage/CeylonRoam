import React from "react";

const AboutUs = () => {
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
    </div>
  );
};

export default AboutUs;
