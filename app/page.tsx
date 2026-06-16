"use client";

import { useState, useEffect } from "react";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import SearchBar from "./components/SearchBar";
import type { Player } from "./types/player";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/players");
        const data = await res.json();
        setPlayers(data);
      } catch (error) {
        console.error("Failed to fetch players:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleSelect = (player: Player) => {
    console.log("Selected:", player);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0b] text-[#ededed]">
      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bloom {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .rise { animation: rise 1.1s cubic-bezier(0.2, 0.7, 0.1, 1) both; }
        .bloom { animation: bloom 2.4s cubic-bezier(0.2, 0.7, 0.1, 1) both; }
      `}</style>

      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="bloom absolute left-1/2 top-[38%] h-[760px] w-[760px] rounded-full bg-[#ff5e2b]/[0.08] blur-[140px]"
          style={{ transform: "translate(-50%, -50%)" }}
        />
        <svg
          className="absolute bottom-[-40px] left-1/2 -translate-x-1/2"
          width="1600"
          height="620"
          viewBox="0 0 1600 620"
          fill="none"
          aria-hidden
        >
          <path d="M -50 620 Q 800 -80 1650 620"  stroke="rgba(237,237,237,0.06)" strokeWidth="1" />
          <path d="M -150 620 Q 800 -200 1750 620" stroke="rgba(237,237,237,0.04)" strokeWidth="1" />
          <path d="M -250 620 Q 800 -320 1850 620" stroke="rgba(237,237,237,0.03)" strokeWidth="1" />
        </svg>
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* nav */}
      <header
        className={`${mono.className} rise relative z-10 flex items-center justify-between px-8 py-7 text-[11px] uppercase tracking-[0.32em] text-[#ededed]/55 lg:px-14`}
        style={{ animationDelay: "0.05s" }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#ff5e2b]" />
          NBA · Shot Index
        </div>
        <div>{loading ? "Loading…" : `${players.length.toLocaleString()} players`}</div>
      </header>

      {/* hero */}
      <section className="relative z-10 flex min-h-[calc(100vh-180px)] flex-col items-center justify-start px-6 pt-[8vh]">
        <div className="flex w-full max-w-[680px] flex-col items-center gap-7 text-center">
          <span
            className={`${mono.className} rise text-[11px] uppercase tracking-[0.42em] text-[#ff5e2b]`}
            style={{ animationDelay: "0.15s" }}
          >
            shot diet analytics
          </span>

          <h1
            className={`${fraunces.className} rise leading-[0.84] tracking-[-0.045em] text-[clamp(56px,10vw,128px)] font-[900]`}
            style={{ animationDelay: "0.25s" }}
          >
            <span className="block">Shooters</span>
            <span className="block italic text-[#ff5e2b]">
              Shoot<span className="text-[#ff5e2b]/70">.</span>
            </span>
          </h1>

          <p
            className={`${mono.className} rise max-w-[460px] text-[13px] leading-[1.75] tracking-wide text-[#ededed]/55`}
            style={{ animationDelay: "0.4s" }}
          >
            search up your favorite player and explore their shot diet — every
            catch-and-shoot, every pull-up, every dagger from the floor.
          </p>

          <div
            className="rise mt-3 w-full max-w-md"
            style={{ animationDelay: "0.55s" }}
          >
            <SearchBar players={players} onSelect={handleSelect} />
          </div>
        </div>
      </section>

      {/* footer */}
      <footer
        className={`${mono.className} rise relative z-10 flex items-center justify-between px-8 py-6 text-[10px] uppercase tracking-[0.32em] text-[#ededed]/35 lg:px-14`}
        style={{ animationDelay: "0.7s" }}
      >
        <span>2025—26 season</span>
        <span className="hidden sm:inline">made for hoopheads</span>
        <span>v 0.1</span>
      </footer>
    </main>
  );
}
