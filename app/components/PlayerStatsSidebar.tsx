import React from "react";
import { DM_Serif_Display, JetBrains_Mono } from "next/font/google";

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
  ACTION_TYPE?: string;
  SHOT_ZONE_BASIC?: string;
  SHOT_ZONE_AREA?: string;
  PTS?: number;
};

type Stats = {
  GP: number;
  PTS: number;
};

type PlayerStatsSidebarProps = {
  playerName: string;
  shots: Shot[];
  seasonStats?: Stats;
  loading?: boolean;
};

function Skel({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-pulse rounded bg-white/[0.07] ${className ?? ""}`}
    />
  );
}

function SidebarSkeleton() {
  return (
    <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 backdrop-blur-md">
      <div className="pointer-events-none absolute -right-24 -top-32 h-64 w-64 rounded-full bg-[#ff5e2b]/[0.08] blur-[80px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ededed]/15 to-transparent" />

      <header className="relative">
        <div
          className={`${mono.className} text-[10px] uppercase tracking-[0.42em] text-[#ff5e2b]`}
        >
          by the numbers
        </div>
        <div
          className={`${mono.className} mt-2 text-[10px] uppercase tracking-[0.32em] text-[#ededed]/35`}
        >
          fetching report…
        </div>
      </header>

      <div className="relative mt-7 flex items-end gap-3 border-b border-white/[0.07] pb-7">
        <Skel className="h-[68px] w-[140px]" />
        <div
          className={`${mono.className} flex flex-col gap-1 pb-2 text-[10px] uppercase tracking-[0.3em] text-[#ededed]/30`}
        >
          <span>points</span>
          <span>per game</span>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        {(["FG%", "3PT%", "Attempts", "Games"] as const).map((label) => (
          <div
            key={label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4"
          >
            <div
              className={`${mono.className} text-[10px] uppercase tracking-[0.3em] text-[#ededed]/30`}
            >
              {label}
            </div>
            <Skel className="mt-2 h-[24px] w-[60px]" />
          </div>
        ))}
      </div>

      <div className="relative mt-8">
        <div
          className={`${mono.className} mb-3 text-[10px] uppercase tracking-[0.4em] text-[#ededed]/30`}
        >
          ⏤ signature shot
        </div>
        <div className="relative overflow-hidden rounded-xl border border-[#ff5e2b]/15 bg-[#ff5e2b]/[0.03] p-5">
          <div className="absolute inset-y-0 left-0 w-[2px] bg-[#ff5e2b]/40" />
          <Skel className="h-[22px] w-[200px]" />
          <div className="mt-3 flex gap-2">
            <Skel className="h-[10px] w-[90px]" />
            <Skel className="h-[10px] w-[60px]" />
            <Skel className="h-[10px] w-[80px]" />
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div
          className={`${mono.className} mb-4 text-[10px] uppercase tracking-[0.4em] text-[#ededed]/30`}
        >
          ⏤ shot distribution
        </div>
        {["paint", "mid-range", "three-point"].map((label) => (
          <div key={label} className="mb-4 last:mb-0">
            <div className="mb-2 flex items-baseline justify-between">
              <span
                className={`${mono.className} text-[11px] uppercase tracking-[0.32em] text-[#ededed]/55`}
              >
                {label}
              </span>
              <Skel className="h-[14px] w-[40px]" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.06]" />
              <Skel className="h-[10px] w-[55px]" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function PlayerStatsSidebar({
  shots,
  seasonStats,
  loading,
}: PlayerStatsSidebarProps) {
  if (loading) return <SidebarSkeleton />;
  const totalShots = shots.length;
  const madeShots = shots.filter((s) => s.SHOT_MADE_FLAG === 1).length;
  const fgPercentage =
    totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : "0.0";

  const threePointShots = shots.filter((s) => s.SHOT_TYPE == "3PT Field Goal");
  const madeThrees = threePointShots.filter(
    (s) => s.SHOT_MADE_FLAG === 1
  ).length;
  const threePtPercentage =
    threePointShots.length > 0
      ? ((madeThrees / threePointShots.length) * 100).toFixed(1)
      : "0.0";

  const totalPoints = shots.reduce((sum, shot) => {
    if (shot.SHOT_MADE_FLAG === 1) {
      return sum + (shot.SHOT_TYPE == "3PT Field Goal" ? 3 : 2);
    }
    return sum;
  }, 0);

  const ppg =
    seasonStats?.PTS.toFixed(1) ||
    (seasonStats?.GP ? (totalPoints / seasonStats.GP).toFixed(1) : "—");

  const shotsByType: {
    [key: string]: { made: number; total: number; three: boolean };
  } = {};

  shots.forEach((shot) => {
    let shotType = "Unknown";
    let shotZone = "error";
    let shotArea = "Unknown";

    if (!shot.ACTION_TYPE?.includes("Jump Shot")) {
      shot.ACTION_TYPE = shot.ACTION_TYPE?.replace(" Shot", "");
      shot.ACTION_TYPE = shot.ACTION_TYPE?.replace(" shot", "");
    }
    if (shot.ACTION_TYPE?.includes("Finger Roll")) {
      shot.ACTION_TYPE = shot.ACTION_TYPE?.replace(" Finger Roll", "");
    }
    if (shot.ACTION_TYPE?.includes("Running")) {
      shot.ACTION_TYPE = shot.ACTION_TYPE?.replace("Running", "Driving");
    }

    if (shot.SHOT_ZONE_BASIC == "Above the Break 3") {
      if (shot.SHOT_ZONE_AREA == "Center(C)") {
        shotZone = "Top of the Key";
      } else if (shot.SHOT_ZONE_AREA == "Left Side Center(LC)") {
        shotZone = "Left Wing";
      } else if (shot.SHOT_ZONE_AREA == "Right Side Center(RC)") {
        shotZone = "Right Wing";
      } else {
        shotZone = "Above the Break";
      }
    } else if (shot.SHOT_ZONE_BASIC == "Left Corner 3") {
      shotZone = "Left Corner";
    } else if (shot.SHOT_ZONE_BASIC == "Right Corner 3") {
      shotZone = "Right Corner";
    } else {
      shotZone = "changedZone";
    }

    if (shot.SHOT_ZONE_AREA == "Left Side(L)") {
      shotArea = "Left Side Baseline";
    } else if (shot.SHOT_ZONE_AREA == "Right Side(R)") {
      shotArea = "Right Side Baseline";
    } else if (shot.SHOT_ZONE_AREA == "Left Side Center(LC)") {
      shotArea = "Left Side";
    } else if (shot.SHOT_ZONE_AREA == "Right Side Center(RC)") {
      shotArea = "Right Side";
    } else if (shot.SHOT_ZONE_AREA == "Center(C)") {
      shotArea = "Straight-on";
    } else {
      shotArea = "changedArea";
    }

    if (shot.SHOT_ZONE_BASIC == "Restricted Area") {
      shotType = shot.ACTION_TYPE || "Unknown";
    } else if (shot.SHOT_TYPE == "3PT Field Goal") {
      shotType = shotZone + " Three-Point " + shot.ACTION_TYPE;
    } else {
      shotType =
        shotArea + " " + shot.ACTION_TYPE + ", " + shot.SHOT_ZONE_BASIC;
    }

    const isThree = shot.SHOT_TYPE == "3PT Field Goal";

    if (!shotsByType[shotType]) {
      shotsByType[shotType] = { made: 0, total: 0, three: isThree };
    }
    shotsByType[shotType].total++;
    if (shot.SHOT_MADE_FLAG === 1) {
      shotsByType[shotType].made++;
    }
  });

  // Signature shot = blend of efficiency, diet share, and shot difficulty.
  // Dunks and putback layups are penalized so they only win when they
  // genuinely dominate a player's offense (Duren, lob-era Wemby).
  // Mid-range and pull-up jumpers get a small boost so a skill-shot like
  // SGA's mid-range beats his higher-FG% but lower-volume rim finishes.
  // Floor scales with diet size so low-volume players still qualify.
  const minAttempts = Math.max(1, Math.ceil(Math.sqrt(totalShots)));
  let bestShotType = "—";
  let bestScore = 0;
  let bestPercentage = 0;
  let bestShotAttempts = 0;
  let bestShare = 0;

  Object.entries(shotsByType).forEach(([type, stats]) => {
    if (stats.total < minAttempts) return;

    const fg = (stats.made / stats.total) * 100;
    const share = totalShots > 0 ? stats.total / totalShots : 0;

    const lower = type.toLowerCase();
    const isDunk =
      lower.includes("dunk") || lower.includes("alley oop");
    const isLayup =
      lower.includes("layup") ||
      lower.includes("tip") ||
      lower.includes("putback");
    const isJumper =
      lower.includes("jump shot") ||
      lower.includes("hook") ||
      lower.includes("floating") ||
      lower.includes("fadeaway");

    let difficulty = 1.0;
    if (stats.three) difficulty *= 1.5;
    if (isDunk) difficulty *= 0.55;
    else if (isLayup) difficulty *= 0.8;
    else if (isJumper && !stats.three) difficulty *= 1.5;

    const volumeBoost = 1 + 1.5 * share;
    const score = fg * difficulty * volumeBoost;

    if (score > bestScore) {
      bestScore = score;
      bestShotType = type;
      bestShotAttempts = stats.total;
      bestPercentage = fg;
      bestShare = share;
    }
  });

  const paintShots = shots.filter((s) => s.SHOT_DISTANCE < 8);
  const midRangeShots = shots.filter(
    (s) => s.SHOT_DISTANCE >= 8 && s.SHOT_TYPE == "2PT Field Goal"
  );

  const paintFG =
    paintShots.length > 0
      ? (
          (paintShots.filter((s) => s.SHOT_MADE_FLAG === 1).length /
            paintShots.length) *
          100
        ).toFixed(1)
      : "0.0";

  const midRangeFG =
    midRangeShots.length > 0
      ? (
          (midRangeShots.filter((s) => s.SHOT_MADE_FLAG === 1).length /
            midRangeShots.length) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 backdrop-blur-md">
      <div className="pointer-events-none absolute -right-24 -top-32 h-64 w-64 rounded-full bg-[#ff5e2b]/[0.08] blur-[80px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ededed]/15 to-transparent" />

      <header className="relative">
        <div
          className={`${mono.className} text-[10px] uppercase tracking-[0.42em] text-[#ff5e2b]`}
        >
          by the numbers
        </div>
        <div
          className={`${mono.className} mt-2 text-[10px] uppercase tracking-[0.32em] text-[#ededed]/35`}
        >
          season report
        </div>
      </header>

      {/* hero stat: PPG */}
      <div className="relative mt-7 flex items-end gap-3 border-b border-white/[0.07] pb-7">
        <span
          className={`${display.className} text-[78px] leading-[0.85] tracking-[-0.045em] italic text-[#ededed]`}
        >
          {ppg}
        </span>
        <div
          className={`${mono.className} flex flex-col gap-1 pb-2 text-[10px] uppercase tracking-[0.3em] text-[#ededed]/45`}
        >
          <span>points</span>
          <span>per game</span>
        </div>
      </div>

      {/* secondary stats grid */}
      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <StatCard label="FG%" value={fgPercentage} suffix="%" />
        <StatCard label="3PT%" value={threePtPercentage} suffix="%" />
        <StatCard label="Attempts" value={totalShots.toString()} />
        <StatCard
          label="Games"
          value={seasonStats?.GP?.toString() ?? "—"}
        />
      </div>

      {/* signature shot */}
      <div className="relative mt-8">
        <div
          className={`${mono.className} mb-3 text-[10px] uppercase tracking-[0.4em] text-[#ededed]/45`}
        >
          ⏤ signature shot
        </div>
        <div className="relative overflow-hidden rounded-xl border border-[#ff5e2b]/25 bg-[#ff5e2b]/[0.05] p-5">
          <div className="absolute inset-y-0 left-0 w-[2px] bg-[#ff5e2b]" />
          <div
            className={`${display.className} text-[19px] leading-tight italic text-[#ededed]`}
          >
            {bestShotType}
          </div>
          <div
            className={`${mono.className} mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.3em] text-[#ededed]/45`}
          >
            <span className="text-[#ff5e2b]">
              {bestPercentage.toFixed(1)}% accuracy
            </span>
            <span className="text-[#ededed]/25">·</span>
            <span>{bestShotAttempts} att.</span>
            <span className="text-[#ededed]/25">·</span>
            <span>{(bestShare * 100).toFixed(0)}% of diet</span>
          </div>
        </div>
      </div>

      {/* distribution */}
      <div className="relative mt-8">
        <div
          className={`${mono.className} mb-4 text-[10px] uppercase tracking-[0.4em] text-[#ededed]/45`}
        >
          ⏤ shot distribution
        </div>
        <ZoneBreakdown
          label="paint"
          attempts={paintShots.length}
          percentage={paintFG}
          total={totalShots}
        />
        <ZoneBreakdown
          label="mid-range"
          attempts={midRangeShots.length}
          percentage={midRangeFG}
          total={totalShots}
        />
        <ZoneBreakdown
          label="three-point"
          attempts={threePointShots.length}
          percentage={threePtPercentage}
          total={totalShots}
        />
      </div>
    </aside>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.03]">
      <div
        className={`${mono.className} text-[10px] uppercase tracking-[0.3em] text-[#ededed]/40`}
      >
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`${display.className} text-[26px] leading-none tracking-[-0.02em] italic text-[#ededed]`}
        >
          {value}
        </span>
        {suffix && (
          <span
            className={`${mono.className} text-[12px] text-[#ededed]/45`}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ZoneBreakdown({
  label,
  attempts,
  percentage,
  total,
}: {
  label: string;
  attempts: number;
  percentage: string;
  total: number;
}) {
  const distribution = total > 0 ? (attempts / total) * 100 : 0;

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-baseline justify-between">
        <span
          className={`${mono.className} text-[11px] uppercase tracking-[0.32em] text-[#ededed]/70`}
        >
          {label}
        </span>
        <span
          className={`${display.className} text-[15px] italic text-[#ededed]`}
        >
          {percentage}
          <span className={`${mono.className} ml-0.5 text-[10px] text-[#ededed]/40`}>
            %
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#ff5e2b]/80 transition-all duration-700"
            style={{ width: `${distribution}%` }}
          />
        </div>
        <span
          className={`${mono.className} min-w-[62px] text-right text-[10px] uppercase tracking-[0.28em] text-[#ededed]/35`}
        >
          {attempts} sh
        </span>
      </div>
    </div>
  );
}
