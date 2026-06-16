import React from 'react';
import { computeMikkTSpaceTangents } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
};

export default function PlayerStatsSidebar({ 
  playerName, 
  shots,
  seasonStats 
}: PlayerStatsSidebarProps) {
  
  // Calculate shooting percentages
  const totalShots = shots.length;
  const madeShots = shots.filter(s => s.SHOT_MADE_FLAG === 1).length;
  const fgPercentage = totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : '0.0';
  
  // Three-point shooting (shots labeled as 3PT Field Goals)
  const threePointShots = shots.filter(s => s.SHOT_TYPE == "3PT Field Goal");
  const madeThrees = threePointShots.filter(s => s.SHOT_MADE_FLAG === 1).length;
  const threePtPercentage = threePointShots.length > 0 
    ? ((madeThrees / threePointShots.length) * 100).toFixed(1) 
    : '0.0';
  
  // Calculate PPG from shot data if not provided
  const totalPoints = shots.reduce((sum, shot) => {
    if (shot.SHOT_MADE_FLAG === 1) {
      return sum + (shot.SHOT_TYPE == "3PT Field Goal" ? 3 : 2);
    }
    return sum;
  }, 0);
  
  const ppg = seasonStats?.PTS.toFixed(1) || 
    (seasonStats?.GP ? (totalPoints / seasonStats.GP).toFixed(1) : 'N/A');
  
  // Find best shooting zone
  const shotsByType: { [key: string]: { made: number; total: number, three: boolean } } = {};
  
  // Before your forEach loop, add:
  console.log("Sample shots:", shots.slice(0, 5).map(s => ({
    SHOT_TYPE: s.SHOT_TYPE,
    SHOT_DISTANCE: s.SHOT_DISTANCE,
    SHOT_ZONE_BASIC: s.SHOT_ZONE_BASIC,
    SHOT_ZONE_AREA: s.SHOT_ZONE_AREA,
    ACTION_TYPE: s.ACTION_TYPE
  })));

  shots.forEach(shot => {
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
      shotType = shotArea + " " + shot.ACTION_TYPE + ", " + shot.SHOT_ZONE_BASIC;
    }
    
    let isThree = false;
    if (shot.SHOT_TYPE == "3PT Field Goal") {
      isThree = true;
    }

    if (!shotsByType[shotType]) {
      shotsByType[shotType] = { made: 0, total: 0, three: isThree };
    }
    shotsByType[shotType].total++;
    if (shot.SHOT_MADE_FLAG === 1) {
      shotsByType[shotType].made++;
    }
  });
  
  // Find shot type with best percentage (minimum 10 attempts)
  let bestShotType = 'N/A';
  let bestTrueShooting = 0;
  let bestPercentage = 0;
  let bestPPS = 0;
  let bestShotAttempts = 0;

  Object.entries(shotsByType).forEach(([type, stats]) => {
    if (stats.total >= 10) {
      let trueShooting = (stats.made / stats.total) * 100;
      bestShotAttempts = stats.total;

      if (stats.three) {
        trueShooting = trueShooting * 1.5;
      }

      if (trueShooting > bestTrueShooting) {
        bestTrueShooting = trueShooting;
        bestShotType = type;

        if (stats.three) {
          bestPercentage = bestTrueShooting / 1.5;
        } else {
          bestPercentage = bestTrueShooting;
        }

        bestPPS = 2 * bestTrueShooting;
      }
    }
  });
  
  // Shot zone breakdown
  const paintShots = shots.filter(s => s.SHOT_DISTANCE < 8);
  const midRangeShots = shots.filter(s => s.SHOT_DISTANCE >= 8 && s.SHOT_TYPE == "2PT Field Goal");
  
  const paintFG = paintShots.length > 0
    ? ((paintShots.filter(s => s.SHOT_MADE_FLAG === 1).length / paintShots.length) * 100).toFixed(1)
    : '0.0';
  
  const midRangeFG = midRangeShots.length > 0
    ? ((midRangeShots.filter(s => s.SHOT_MADE_FLAG === 1).length / midRangeShots.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div style={{
      width: '320px',
      background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
      borderRadius: '12px',
      padding: '24px',
      color: '#f1f5f9',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      height: 'fit-content'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: '#ffffff',
          marginBottom: '4px'
        }}>
          {playerName}
        </h2>
        <p style={{ 
          margin: 0,
          fontSize: '13px',
          color: '#94a3b8'
        }}>
          Season Statistics
        </p>
      </div>

      {/* Main Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard 
          label="PPG"
          value={ppg}
          color="#60a5fa"
        />
        <StatCard 
          label="FG%"
          value={`${fgPercentage}%`}
          color="#34d399"
        />
        <StatCard 
          label="3PT%"
          value={`${threePtPercentage}%`}
          color="#f59e0b"
        />
        <StatCard 
          label="Attempts"
          value={totalShots}
          color="#a78bfa"
        />
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: '#334155',
        marginBottom: '24px'
      }} />

      {/* Best Shot Type */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px'
        }}>
          Best Shot Type
        </h3>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#10b981',
            marginBottom: '4px'
          }}>
            {bestShotType}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#94a3b8'
          }}>
            {bestPercentage.toFixed(1)}% accuracy, {bestShotAttempts} attempts.
          </div>
        </div>
      </div>

      {/* Shot Distribution */}
      <div>
        <h3 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '12px'
        }}>
          Shot Distribution
        </h3>
        
        <ZoneBreakdown 
          label="Paint"
          attempts={paintShots.length}
          percentage={paintFG}
          total={totalShots}
          color="#ef4444"
        />
        <ZoneBreakdown 
          label="Mid-Range"
          attempts={midRangeShots.length}
          percentage={midRangeFG}
          total={totalShots}
          color="#f59e0b"
        />
        <ZoneBreakdown 
          label="Three-Point"
          attempts={threePointShots.length}
          percentage={threePtPercentage}
          total={totalShots}
          color="#3b82f6"
        />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.6)',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid rgba(51, 65, 85, 0.5)'
    }}>
      <div style={{
        fontSize: '12px',
        color: '#94a3b8',
        marginBottom: '4px',
        fontWeight: 500
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '28px',
        fontWeight: 700,
        color: color
      }}>
        {value}
      </div>
    </div>
  );
}

// Zone Breakdown Component
function ZoneBreakdown({ 
  label, 
  attempts, 
  percentage, 
  total,
  color 
}: { 
  label: string; 
  attempts: number; 
  percentage: string;
  total: number;
  color: string;
}) {
  const distributionPercent = total > 0 ? ((attempts / total) * 100).toFixed(0) : '0';
  
  return (
    <div style={{
      marginBottom: '12px',
      background: 'rgba(30, 41, 59, 0.4)',
      borderRadius: '6px',
      padding: '12px',
      border: '1px solid rgba(51, 65, 85, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#cbd5e1'
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: color
        }}>
          {percentage}%
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          flex: 1,
          height: '6px',
          background: '#1e293b',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${distributionPercent}%`,
            background: color,
            transition: 'width 0.3s ease'
          }} />
        </div>
        <span style={{
          fontSize: '11px',
          color: '#64748b',
          minWidth: '60px',
          textAlign: 'right'
        }}>
          {attempts} shots
        </span>
      </div>
    </div>
  );
}