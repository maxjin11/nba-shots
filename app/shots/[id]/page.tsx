"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import ShotChart from "../../components/ShotChart";
import SearchBar from "../../components/SearchBar";
import PlayerStatsSidebar from "@/app/components/PlayerStatsSidebar";
import type { Player } from "../../types/player";

const display = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

type Shot = {
  LOC_X: number;
  LOC_Y: number;
  SHOT_MADE_FLAG: number;
  SHOT_DISTANCE: number;
  SHOT_TYPE: string;
};

type Stats = {
  GP: number;
  PTS: number;
};

type RateLimit = {
  detail: string;
  retryAfter: number;
};

function formatCountdown(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

export default function ShotsPage() {
  const params = useParams();
  const playerId = params.id;
  const [shots, setShots] = useState<Shot[]>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [shotsLoading, setShotsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);

  useEffect(() => {
    const fetchShots = async () => {
      try {
        setShotsLoading(true);
        setError(null);
        setRateLimit(null);
        const res = await fetch(`http://127.0.0.1:8000/shots/${playerId}`);

        if (res.status === 429) {
          const body = await res
            .json()
            .catch(() => ({ detail: "Too many searches. Try again soon." }));
          const retryHeader = res.headers.get("Retry-After");
          const retryAfter = Math.max(1, parseInt(retryHeader ?? "60", 10) || 60);
          setRateLimit({
            detail:
              typeof body?.detail === "string"
                ? body.detail
                : "Too many searches. Try again soon.",
            retryAfter,
          });
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch shots");
        const data = await res.json();
        setShots(data);

        const playersRes = await fetch("http://127.0.0.1:8000/players");
        const playersList: Player[] = await playersRes.json();
        const player = playersList.find(
          (p) => p.id === parseInt(playerId as string)
        );
        if (player) setPlayerName(player.full_name);
      } catch (err) {
        console.error("Failed to fetch shots:", err);
        setError("failed to load shot data");
      } finally {
        setShotsLoading(false);
      }
    };
    if (playerId) fetchShots();
  }, [playerId]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/players");
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Failed to fetch players:", err);
      }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/players/${playerId}/current-season`
        );

        if (res.status === 429) {
          const body = await res
            .json()
            .catch(() => ({ detail: "Too many calls. Try again soon." }));
          const retryHeader = res.headers.get("Retry-After");
          const retryAfter = Math.max(
            1,
            parseInt(retryHeader ?? "60", 10) || 60
          );
          // First 429 wins — if shots already tripped the limiter, keep its
          // (slightly older, slightly larger) countdown rather than restarting.
          setRateLimit(
            (prev) =>
              prev ?? {
                detail:
                  typeof body?.detail === "string"
                    ? body.detail
                    : "Too many calls. Try again soon.",
                retryAfter,
              }
          );
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setStats(null);
      }
    };
    if (playerId) fetchStats();
  }, [playerId]);

  // Countdown tick — drains the retry-after by 1s each second, clears when done
  useEffect(() => {
    if (!rateLimit) return;
    if (rateLimit.retryAfter <= 0) {
      setRateLimit(null);
      return;
    }
    const id = setTimeout(() => {
      setRateLimit((prev) =>
        prev ? { ...prev, retryAfter: prev.retryAfter - 1 } : null
      );
    }, 1000);
    return () => clearTimeout(id);
  }, [rateLimit]);

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
        .rise { animation: rise 1s cubic-bezier(0.2, 0.7, 0.1, 1) both; }
      `}</style>

      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[8%] h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-[#ff5e2b]/[0.06] blur-[150px]" />
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
        className={`${mono.className} rise relative z-20 mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-8 py-6 lg:px-12`}
      >
        <Link
          href="/"
          className="group flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-[#ededed]/55 no-underline transition-colors hover:text-[#ededed]"
        >
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#ff5e2b]" />
          <span>NBA · Shot Index</span>
          <span className="text-[#ededed]/25 transition-colors group-hover:text-[#ededed]/55">
            / {playerName || "…"}
          </span>
        </Link>
        <div className="hidden w-full max-w-[320px] md:block">
          <SearchBar players={players} onSelect={handleSelect} />
        </div>
      </header>

      {/* hero */}
      <section
        className="rise relative z-10 px-8 pb-10 pt-6 lg:px-12"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="mx-auto max-w-[1500px]">
          <div
            className={`${mono.className} mb-4 text-[11px] uppercase tracking-[0.42em] text-[#ff5e2b]`}
          >
            shot diet · 2025—26 season
          </div>
          <h1
            className={`${display.className} text-[clamp(48px,7vw,108px)] leading-[0.9] tracking-[-0.04em] italic`}
          >
            {playerName || (shotsLoading ? "—" : "Unknown")}
          </h1>
          <p
            className={`${mono.className} mt-4 text-[11px] uppercase tracking-[0.32em] text-[#ededed]/40`}
          >
            {rateLimit
              ? "search blocked · cool down"
              : shotsLoading
              ? "compiling shot log…"
              : `${shots.length.toLocaleString()} shots logged`}
          </p>
        </div>
      </section>

      {/* main grid */}
      <section
        className="rise relative z-10 px-8 pb-16 lg:px-12"
        style={{ animationDelay: "0.2s" }}
      >
        <div className="mx-auto max-w-[1500px]">
          {rateLimit ? (
            <RateLimitBanner
              detail={rateLimit.detail}
              retryAfter={rateLimit.retryAfter}
            />
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="min-w-0 flex-1">
                {error ? (
                  <div
                    className={`${mono.className} flex h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-[11px] uppercase tracking-[0.32em] text-[#ff5e2b]/70`}
                  >
                    {error}
                  </div>
                ) : (
                  <ShotChart
                    shots={shots}
                    playerName={playerName}
                    loading={shotsLoading}
                  />
                )}
              </div>
              <div className="lg:w-[340px] lg:shrink-0">
                <PlayerStatsSidebar
                  playerName={playerName}
                  shots={shots}
                  seasonStats={stats || undefined}
                  loading={shotsLoading}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function RateLimitBanner({
  detail,
  retryAfter,
}: {
  detail: string;
  retryAfter: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ff5e2b]/30 bg-[#ff5e2b]/[0.05] p-8 backdrop-blur-md lg:p-10">
      <div className="pointer-events-none absolute -top-32 -right-20 h-64 w-64 rounded-full bg-[#ff5e2b]/[0.18] blur-[100px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff5e2b]/40 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-[#ff5e2b]" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div
            className={`${mono.className} text-[11px] uppercase tracking-[0.42em] text-[#ff5e2b]`}
          >
            ⏤ slow down
          </div>
          <h2
            className={`${display.className} mt-3 text-[clamp(36px,5vw,56px)] leading-[0.95] tracking-[-0.03em] italic text-[#ededed]`}
          >
            searched too fast.
          </h2>
          <p
            className={`${mono.className} mt-4 max-w-[520px] text-[12px] uppercase leading-relaxed tracking-[0.22em] text-[#ededed]/55`}
          >
            {detail}
          </p>
          <p
            className={`${mono.className} mt-3 max-w-[520px] text-[10px] uppercase tracking-[0.32em] text-[#ededed]/35`}
          >
            already-loaded players are still free — try a cached one.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start lg:items-end">
          <div
            className={`${mono.className} text-[10px] uppercase tracking-[0.4em] text-[#ededed]/40`}
          >
            next slot in
          </div>
          <div
            className={`${display.className} mt-1 text-[clamp(56px,9vw,96px)] leading-[0.85] tracking-[-0.04em] italic text-[#ff5e2b] tabular-nums`}
          >
            {formatCountdown(retryAfter)}
          </div>
        </div>
      </div>
    </div>
  );
}
