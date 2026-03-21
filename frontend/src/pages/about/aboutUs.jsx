import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';

const AboutUs = () => {
  const location = useLocation();
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
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-5xl mx-auto px-5 py-10">
        <div className="rounded-3xl border-2 border-transparent px-6 py-8 mb-12 shadow-[0_0_0_1px_rgba(251,191,36,0.35)] bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
          <h1 className="text-center text-[#fbbf24] mb-7 text-4xl md:text-5xl font-semibold tracking-wide">
            ABOUT US
          </h1>
          <p className="text-center text-gray-200 text-lg mb-7 leading-relaxed">
            <b>CeylonRoam</b> is an AI-powered travel assistant designed to transform how people explore Sri Lanka. Our
            platform combines advanced artificial intelligence with modern web technologies to provide travelers with a
            seamless, personalized, and stress-free journey. What sets CeylonRoam apart is our use of advanced AI to
            generate personalized itineraries, optimize travel routes, and provide real-time voice translation, all in
            one easy-to-use app. Whether you’re a local adventurer or a first-time visitor, CeylonRoam helps you save
            time, discover hidden gems, and travel confidently.
          </p>
          <p className="text-center text-gray-200 text-lg mb-7 leading-relaxed">
            <b>Our mission</b> is to make travel in Sri Lanka smarter, easier, and more memorable by connecting
            travelers with enriching experiences while supporting sustainable tourism. We believe every journey should
            be unique, accessible, and filled with discovery.
          </p>
          <p className="text-center text-gray-200 text-lg leading-relaxed">
            Have questions, feedback, or partnership ideas? We’d love to hear from you! Get in touch with us at
            ceylon.roam144@gmail.com and let’s make travel better together. Join us on CeylonRoam and embark on a
            journey filled with adventure, discovery, and unforgettable memories.
          </p>
        </div>

        <div className="grid gap-6 mb-12 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-transparent px-6 py-7 shadow-md bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
            <h2 className="text-[#fbbf24] text-2xl md:text-[26px] mb-4 font-semibold">
              Why CeylonRoam Matters
            </h2>
            <p className="text-gray-200 text-base md:text-lg mb-4 leading-relaxed">
              Tourism plays a vital role in Sri Lanka’s economy, contributing significantly to employment and national
              income. With over 1.48 million tourists visiting the country in 2023, the industry is rapidly growing.
            </p>
            <p className="text-gray-200 text-base md:text-lg mb-2">However, travelers still face several challenges:</p>
            <ul className="list-disc pl-5 mb-4 text-gray-200 text-base md:text-lg space-y-1">
              <li>Fragmented and unreliable travel information</li>
              <li>Language barriers with local communities</li>
              <li>Complex transportation and route planning</li>
            </ul>
            <p className="text-gray-200 text-base md:text-lg leading-relaxed">
              CeylonRoam was created to solve these problems and enhance the overall travel experience.
            </p>
          </div>

          <div className="rounded-3xl border-2 border-transparent px-6 py-7 shadow-md bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
            <h2 className="text-[#fbbf24] text-2xl md:text-[26px] mb-4 font-semibold">
              Our Vision
            </h2>
            <p className="text-gray-200 text-base md:text-lg mb-4 leading-relaxed">
              We envision a future where every traveler can explore Sri Lanka with confidence, ease, and personalized
              guidance powered by AI.
            </p>
            <p className="text-gray-200 text-base md:text-lg leading-relaxed">
              CeylonRoam is more than just a travel app, it’s your smart companion for discovering Sri Lanka.
            </p>
          </div>
        </div>

        <div className="mt-10 mb-10 rounded-3xl border-2 border-transparent px-6 py-7 shadow-xl bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
          <h2 className="text-center text-[#fbbf24] text-2xl md:text-3xl font-semibold mb-6">Founders</h2>
          <ul className="grid gap-6 max-w-4xl mx-auto list-none p-0 md:grid-cols-3">
            <li className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
              <div className="bg-amber-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                SG
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Sasanka Gallage</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </li>
            <li className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
              <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                TF
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Tashmi Fernando</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </li>
            <li className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
              <div className="bg-lime-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                OG
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Oshadhi Goonewardena</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </li>
            <li className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
              <div className="bg-red-400 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                RD
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Rashmika Dewangi</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </li>
            <li className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
              <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                TP
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Thamindu Perera</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </li>
            <li className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
              <div className="bg-cyan-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                SJ
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Sandaru Jayasekara</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </li>
          </ul>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="rounded-3xl border-2 border-transparent px-6 py-8 max-w-sm w-full flex flex-col items-center shadow-lg bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]">
            <div className="mb-6">{/* Icon removed */}</div>
            <h2 className="text-center text-2xl md:text-[28px] font-bold text-[#fbbf24] mb-8">Contact Us</h2>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Full Name"
                className="w-full rounded-lg border border-transparent px-4 py-3 text-base outline-none text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-[#fbbf24]/60 focus:border-transparent bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
              />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Email Address"
                className="w-full rounded-lg border border-transparent px-4 py-3 text-base outline-none text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-[#fbbf24]/60 focus:border-transparent bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
              />
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                placeholder="Your Message"
                className="w-full rounded-lg border border-transparent px-4 py-3 text-base outline-none text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-[#fbbf24]/60 focus:border-transparent resize-none bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
              />
              <div className="flex justify-between mb-6">
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
