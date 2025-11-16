import { Component } from "react"; 
import { motion } from "framer-motion"; 
import axios from "axios";

type AppInfo = {
  tagline: string;
};

type SplashState = {
  info: AppInfo | null;
};

const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      repeatType: "loop" as const,
      duration: 2.5,
      ease: "easeInOut"
    }
  }
};

const loaderAnimation = {
  scale: [1, 1.3, 1],
  opacity: [0.6, 1, 0.6]
};

const loaderTransition = {
  repeat: Infinity,
  repeatType: "loop" as const,
  duration: 1.1
};

class Splash extends Component<Record<string, never>, SplashState> {
  private controller: AbortController | null = null;

  private pingTimer: number | null = null;

  private readonly titleLetters = Array.from("TRAVEL-AI");

  constructor(props: Record<string, never>) {
    super(props);
    this.state = { info: null };
  }

  componentDidMount(): void {
    this.fetchInfo();
    this.pingTimer = window.setInterval(this.fetchInfo, 8000);
  }

  componentWillUnmount(): void {
    this.controller?.abort();
    if (this.pingTimer !== null) {
      window.clearInterval(this.pingTimer);
    }
  }

  private fetchInfo = async (): Promise<void> => {
    this.controller?.abort();
    this.controller = new AbortController();

    try {
      const response = await axios.get<AppInfo>("/api/meta", {
        signal: this.controller.signal
      });
      this.setState({ info: response.data });
    } catch (error) {
      this.setState({
        info: {
          tagline: "Charting your next journey with intelligence"
        }
      });
    }
  };

  render() {
    const { info } = this.state;

    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black font-sans text-slate-100">
        <div className="relative z-10 flex max-w-xl flex-col items-center gap-10 px-6 py-12 text-center sm:px-10 lg:px-16">
          <motion.div
            className="flex items-center gap-7"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div
              className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#66c6ff,#1564c0)] shadow-[0_10px_35px_rgba(27,99,171,0.35)] sm:h-24 sm:w-24"
              aria-hidden
            >
              <motion.div
                className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.45),transparent)] opacity-80"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
              />
              <span className="relative z-10 text-4xl drop-shadow-[0_5px_20px_rgba(0,0,0,0.3)] sm:text-5xl">🏝️</span>
            </div>
            <div
              className="flex gap-1 text-4xl font-bold uppercase tracking-[0.2em] sm:text-5xl sm:tracking-[0.3em]"
              aria-label="TRAVEL-AI"
            >
              {this.titleLetters.map((char: string, index: number) => (
                <motion.span
                  key={`${char}-${index}`}
                  className="inline-block"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.p
            className="text-lg font-light text-white/90 opacity-90 sm:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            {info?.tagline ?? "Curating smart experiences for every journey"}
          </motion.p>

          <motion.div className="flex items-center gap-3">
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                className="h-3 w-3 rounded-full bg-[linear-gradient(135deg,#7dd3fc,#38bdf8)] shadow-[0_0_20px_rgba(125,211,252,0.6)]"
                animate={loaderAnimation}
                transition={{ ...loaderTransition, delay: dot * 0.18 }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }
}

export default Splash;
