import React, { useEffect, useRef, useState } from "react";
import bgImage from "../../assets/2.jpg";

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

const faqItems = [
  {
    question: "What is CeylonRoam?",
    answer:
      "CeylonRoam is an AI-powered travel assistant designed to help you explore Sri Lanka بسهولة and efficiently. It provides personalized itineraries, real-time translations, and smart route optimization in one platform.",
  },
  {
    question: "Who can use CeylonRoam?",
    answer:
      "Anyone! Whether you are a local traveler or an international tourist, CeylonRoam is built to support all types of travelers.",
  },
  {
    question: "Is CeylonRoam free to use?",
    answer:
      "Yes, the basic features of CeylonRoam are free. Some advanced features may be introduced in future updates.",
  },
  {
    question: "How does the itinerary planner work?",
    answer:
      "Our AI analyzes your preferences such as budget, travel duration, interests, and destinations to generate a personalized travel plan tailored just for you.",
  },
  {
    question: "Can I customize my itinerary?",
    answer: "Yes! You can modify your itinerary anytime based on your preferences and travel needs.",
  },
  {
    question: "Does CeylonRoam provide real-time updates?",
    answer:
      "Yes, the app uses real-time data to provide updates on routes, travel conditions, and recommendations.",
  },
  {
    question: "How does the translation feature work?",
    answer:
      "CeylonRoam uses advanced Natural Language Processing (NLP) to translate text and voice in real time, helping you communicate easily with locals.",
  },
  {
    question: "Which languages are supported?",
    answer:
      "The app supports Sinhala, Tamil, English, and a wide range of other languages for voice translation, including Arabic, Chinese, Dutch, French, German, Hindi, Italian, Japanese, Korean, Polish, Portuguese, Russian, Spanish and Turkish. We plan to expand to even more languages in the future.",
  },
  {
    question: "How does the route optimizer help me?",
    answer:
      "It finds the most efficient routes by considering distance, traffic conditions, and travel time, helping you avoid delays.",
  },
  {
    question: "Can I use it for public transport?",
    answer:
      "Yes, CeylonRoam supports route planning for buses, trains, and private transport options.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "Creating an account allows you to save itineraries and access personalized features, but some basic features may be used without signing up.",
  },
  {
    question: "Is my data safe?",
    answer: "Yes, we prioritize user privacy and ensure that your data is securely handled.",
  },
  {
    question: "How can I contact support?",
    answer:
      "You can reach us at ceylon.roam144@gmail.com for any questions, feedback, or support.",
  },
  {
    question: "Will there be new features?",
    answer:
      "Yes! We are continuously improving CeylonRoam by adding new AI features, expanding language support, and enhancing user experience.",
  },
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const computeIsDarkFromBg = () => {
    if (typeof document === "undefined") return false;
    const el = document.body || document.documentElement;
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor || style.color || "rgb(0,0,0)";

    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (!m) return false;
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 150; // lower = darker
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return computeIsDarkFromBg() || prefersDark || document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const update = () => setIsDarkMode(computeIsDarkFromBg() || document.documentElement.classList.contains("dark") || (document.body && document.body.classList && document.body.classList.contains("dark")));

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes") {
          update();
          break;
        }
      }
    });

    if (document.documentElement) observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });

    const media = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const mediaHandler = (e) => setIsDarkMode(e.matches || computeIsDarkFromBg());
    if (media) {
      if (media.addEventListener) media.addEventListener("change", mediaHandler);
      else if (media.addListener) media.addListener(mediaHandler);
    }

    const storageHandler = () => update();
    window.addEventListener("storage", storageHandler);

    // also poll briefly in case styles change without mutations (fallback)
    const interval = setInterval(update, 500);

    return () => {
      observer.disconnect();
      if (media) {
        if (media.removeEventListener) media.removeEventListener("change", mediaHandler);
        else if (media.removeListener) media.removeListener(mediaHandler);
      }
      window.removeEventListener("storage", storageHandler);
      clearInterval(interval);
    };
  }, []);

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="relative min-h-screen bg-[#050505]">
      <img
        src={bgImage}
        alt=""
        className="pointer-events-none absolute inset-0 w-full h-full object-cover transition-all duration-700"
        style={{
          filter: `blur(${isDarkMode ? 2 : 1}px) brightness(${isDarkMode ? 0.78 : 1})`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-colors duration-300"
        style={{
          backgroundColor: isDarkMode ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.14)",
        }}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <RevealOnScroll
          delay={0}
          className="rounded-3xl border-2 border-transparent px-6 py-8 mb-8 shadow-[0_0_0_1px_rgba(251,191,36,0.35)] bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box]"
        >
          <h1 className="text-center text-[#fbbf24] mb-4 text-4xl md:text-5xl font-semibold tracking-wide">
            FAQ
          </h1>
          <p className="text-center text-gray-200 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
            Find answers to the most common questions about CeylonRoam.
          </p>
        </RevealOnScroll>

        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <RevealOnScroll
                key={item.question}
                delay={index * 55}
                className="rounded-2xl border-2 border-transparent shadow-md bg-[linear-gradient(#0b0b0b,#0b0b0b),linear-gradient(90deg,#ffe066_0%,#ffc233_45%,#ff6a00_100%)] [background-origin:border-box] [background-clip:padding-box,border-box] mx-auto max-w-3xl"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="w-full text-left px-4 md:px-5 py-3 flex items-center justify-between gap-3"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="text-[#fbbf24] text-base md:text-lg font-semibold leading-snug">
                    {item.question}
                  </span>
                  <span
                    className={[
                      "text-[#fbbf24] text-2xl leading-none transition-transform duration-300",
                      isOpen ? "rotate-45" : "rotate-0",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                <div
                  id={`faq-answer-${index}`}
                  className={[
                    "grid transition-all duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 md:px-6 pb-5 text-gray-200 text-sm md:text-base leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
