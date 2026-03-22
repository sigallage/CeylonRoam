import React, { useEffect, useRef, useState } from "react";

const RevealOnScroll = ({ as: Component = "div", children, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.16 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        className,
        "transition-all duration-700 ease-out will-change-transform",
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95",
      ].join(" ")}
    >
      {children}
    </Component>
  );
};

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="max-w-5xl mx-auto px-5 py-10">
        <RevealOnScroll
          delay={0}
          className="rounded-3xl border-2 border-transparent px-6 py-8 mb-12 shadow-[0_0_0_1px_rgba(251,191,36,0.35)] bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
        >
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
        </RevealOnScroll>

        <div className="grid gap-6 mb-12 md:grid-cols-2">
          <RevealOnScroll
            delay={80}
            className="rounded-3xl border-2 border-transparent px-6 py-7 shadow-md bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
          >
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
          </RevealOnScroll>

          <RevealOnScroll
            delay={160}
            className="rounded-3xl border-2 border-transparent px-6 py-7 shadow-md bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
          >
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
          </RevealOnScroll>
        </div>

        <RevealOnScroll
          delay={140}
          className="mt-10 mb-10 rounded-3xl border-2 border-transparent px-6 py-7 shadow-xl bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
        >
          <h2 className="text-center text-[#fbbf24] text-2xl md:text-3xl font-semibold mb-6">Founders</h2>
          <ul className="grid gap-6 max-w-4xl mx-auto list-none p-0 md:grid-cols-3">
            <RevealOnScroll
              as="li"
              delay={0}
              className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
            >
              <div className="bg-amber-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                SG
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Sasanka Gallage</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </RevealOnScroll>
            <RevealOnScroll
              as="li"
              delay={80}
              className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
            >
              <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                TF
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Tashmi Fernando</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </RevealOnScroll>
            <RevealOnScroll
              as="li"
              delay={160}
              className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
            >
              <div className="bg-lime-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                OG
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Oshadhi Goonewardena</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </RevealOnScroll>
            <RevealOnScroll
              as="li"
              delay={240}
              className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
            >
              <div className="bg-red-400 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                RD
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Rashmika Dewangi</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </RevealOnScroll>
            <RevealOnScroll
              as="li"
              delay={320}
              className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
            >
              <div className="bg-purple-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                TP
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Thamindu Perera</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </RevealOnScroll>
            <RevealOnScroll
              as="li"
              delay={400}
              className="text-center rounded-2xl border border-transparent p-6 flex flex-col items-center transition duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.03] shadow-md bg-[linear-gradient(#111111,#111111),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
            >
              <div className="bg-cyan-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                SJ
              </div>
              <div className="font-semibold mt-3 text-lg text-gray-100">Sandaru Jayasekara</div>
              <div className="text-gray-400 mt-1 text-sm">Full-Stack Developer</div>
            </RevealOnScroll>
          </ul>
        </RevealOnScroll>

        <div className="mt-16 flex justify-center">
          <RevealOnScroll
            delay={180}
            className="rounded-3xl border-2 border-transparent px-6 py-8 max-w-sm w-full h-[330px] flex items-center shadow-lg bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
          >
            <div className="w-full h-10 rounded-full bg-gradient-to-r from-[#ffe066] via-[#ffc233] to-[#ff9f00] shadow-[0_0_22px_rgba(255,194,51,0.55)]" />
        </RevealOnScroll>
      </div>
      </div>
    </div>
  );
};

export default AboutUs;
