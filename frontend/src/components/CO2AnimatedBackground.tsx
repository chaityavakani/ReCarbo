import React from 'react';

interface Props {
  variant?: 'emerald' | 'cyan' | 'amber';
}

export const CO2AnimatedBackground: React.FC<Props> = ({ variant = 'emerald' }) => {
  const colors = {
    emerald: {
      primary: '#10b981',
      secondary: '#34d399',
      glow: 'rgba(16,185,129,0.18)',
      glowSoft: 'rgba(16,185,129,0.07)',
      orb1: '#10b981',
      orb2: '#06b6d4',
      orb3: '#34d399',
    },
    cyan: {
      primary: '#06b6d4',
      secondary: '#22d3ee',
      glow: 'rgba(6,182,212,0.18)',
      glowSoft: 'rgba(6,182,212,0.07)',
      orb1: '#06b6d4',
      orb2: '#10b981',
      orb3: '#3b82f6',
    },
    amber: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      glow: 'rgba(245,158,11,0.18)',
      glowSoft: 'rgba(245,158,11,0.07)',
      orb1: '#f59e0b',
      orb2: '#10b981',
      orb3: '#06b6d4',
    },
  }[variant];

  const molecules = [
    { x: '8%',  y: '20%', delay: '0s',   dur: '7s',  size: 28 },
    { x: '88%', y: '15%', delay: '1.2s', dur: '9s',  size: 22 },
    { x: '75%', y: '70%', delay: '2.5s', dur: '6s',  size: 18 },
    { x: '15%', y: '75%', delay: '0.8s', dur: '8s',  size: 24 },
    { x: '50%', y: '85%', delay: '3s',   dur: '7.5s',size: 16 },
    { x: '92%', y: '50%', delay: '1.8s', dur: '10s', size: 20 },
  ];

  const particles = [
    { x: '20%', y: '30%', delay: '0s',   dur: '5s'  },
    { x: '60%', y: '20%', delay: '1s',   dur: '7s'  },
    { x: '80%', y: '60%', delay: '2s',   dur: '6s'  },
    { x: '35%', y: '80%', delay: '0.5s', dur: '8s'  },
    { x: '10%', y: '55%', delay: '3s',   dur: '5.5s'},
    { x: '70%', y: '40%', delay: '1.5s', dur: '9s'  },
    { x: '45%', y: '10%', delay: '2.5s', dur: '6.5s'},
    { x: '90%', y: '85%', delay: '0.3s', dur: '7.5s'},
  ];

  return (
    <>
      <style>{`
        @keyframes co2Float {
          0%,100% { transform: translateY(0px) rotate(0deg); opacity:0.55; }
          33%      { transform: translateY(-14px) rotate(8deg); opacity:0.85; }
          66%      { transform: translateY(-6px) rotate(-5deg); opacity:0.7; }
        }
        @keyframes co2Particle {
          0%,100% { transform: translateY(0) scale(1); opacity:0.5; }
          50%      { transform: translateY(-20px) scale(1.5); opacity:1; }
        }
        @keyframes co2Ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes co2RingRev {
          from { transform: rotate(0deg) rotateX(60deg); }
          to   { transform: rotate(-360deg) rotateX(60deg); }
        }
        @keyframes co2Pulse {
          0%,100% { opacity:0.15; transform: scale(1); }
          50%      { opacity:0.35; transform: scale(1.08); }
        }
        @keyframes co2StreamLine {
          0%   { stroke-dashoffset: 300; opacity:0; }
          20%  { opacity:0.6; }
          80%  { opacity:0.6; }
          100% { stroke-dashoffset: 0; opacity:0; }
        }
      `}</style>

      {/* deep radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 55% at 85% 50%, ${colors.glow}, transparent 70%)`,
          animation: 'co2Pulse 6s ease-in-out infinite',
        }}
      />

      {/* secondary soft glow left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 40% 60% at 10% 50%, ${colors.glowSoft}, transparent 70%)`,
          animation: 'co2Pulse 9s ease-in-out infinite reverse',
        }}
      />

      {/* SVG layer: globe + orbit rings + stream lines + molecules */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 200"
      >
        {/* ── Half-globe on right side ── */}
        <g transform="translate(700,100)">
          {/* globe circle */}
          <circle cx="0" cy="0" r="88" stroke={colors.primary} strokeWidth="0.8" fill="none" opacity="0.18"
            style={{ animation: 'co2Ring 30s linear infinite', transformOrigin: '0 0' }} />
          {/* latitude lines */}
          {[-60,-40,-20,0,20,40,60].map((dy, i) => {
            const r = Math.sqrt(88*88 - dy*dy);
            return <ellipse key={i} cx="0" cy={dy} rx={r} ry={r*0.32} stroke={colors.primary} strokeWidth="0.5" fill="none" opacity="0.13" />;
          })}
          {/* longitude lines */}
          {[0,30,60,90,120,150].map((angle, i) => (
            <ellipse key={i} cx="0" cy="0" rx="88" ry="88" stroke={colors.primary} strokeWidth="0.5" fill="none" opacity="0.13"
              transform={`rotate(${angle})`} />
          ))}
          {/* orbit ring 1 */}
          <ellipse cx="0" cy="0" rx="110" ry="110" stroke={colors.primary} strokeWidth="0.6" fill="none" opacity="0.2"
            strokeDasharray="4 6"
            style={{ animation: 'co2Ring 18s linear infinite', transformOrigin: '0 0' }} />
          {/* orbit dot 1 */}
          <circle cx="110" cy="0" r="3" fill={colors.orb1} opacity="0.9"
            style={{ animation: 'co2Ring 18s linear infinite', transformOrigin: '0 0',
              filter: `drop-shadow(0 0 5px ${colors.orb1})` }} />
          {/* orbit ring 2 tilted */}
          <ellipse cx="0" cy="0" rx="130" ry="45" stroke={colors.orb2} strokeWidth="0.5" fill="none" opacity="0.15"
            strokeDasharray="3 8"
            style={{ animation: 'co2RingRev 24s linear infinite', transformOrigin: '0 0' }} />
          <circle cx="130" cy="0" r="2.5" fill={colors.orb2} opacity="0.85"
            style={{ animation: 'co2RingRev 24s linear infinite', transformOrigin: '0 0',
              filter: `drop-shadow(0 0 4px ${colors.orb2})` }} />
          {/* orbit ring 3 */}
          <ellipse cx="0" cy="0" rx="150" ry="150" stroke={colors.orb3} strokeWidth="0.4" fill="none" opacity="0.1"
            strokeDasharray="2 10"
            style={{ animation: 'co2Ring 36s linear infinite reverse', transformOrigin: '0 0' }} />
          <circle cx="0" cy="-150" r="2" fill={colors.orb3} opacity="0.8"
            style={{ animation: 'co2Ring 36s linear infinite reverse', transformOrigin: '0 0',
              filter: `drop-shadow(0 0 4px ${colors.orb3})` }} />
        </g>

        {/* ── CO2 stream lines flowing left to right ── */}
        {[30, 80, 130, 160].map((y, i) => (
          <path
            key={i}
            d={`M -10 ${y} Q ${200 + i*30} ${y - 20 + i*10} ${500 + i*20} ${y + 10}`}
            stroke={colors.primary}
            strokeWidth="0.7"
            fill="none"
            opacity="0.18"
            strokeDasharray="300"
            strokeDashoffset="300"
            style={{
              animation: `co2StreamLine ${5 + i * 1.5}s ease-in-out infinite`,
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}

        {/* ── Floating CO2 molecule labels ── */}
        {molecules.map((m, i) => (
          <g
            key={i}
            style={{
              animation: `co2Float ${m.dur} ease-in-out infinite`,
              animationDelay: m.delay,
              transformOrigin: `${m.x} ${m.y}`,
            }}
          >
            <text
              x={m.x} y={m.y}
              fontSize={m.size * 0.45}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fill={colors.primary}
              opacity="0.22"
              textAnchor="middle"
            >
              CO₂
            </text>
          </g>
        ))}
      </svg>

      {/* ── Floating glow particles ── */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: p.x, top: p.y,
            width: i % 3 === 0 ? '6px' : i % 3 === 1 ? '4px' : '3px',
            height: i % 3 === 0 ? '6px' : i % 3 === 1 ? '4px' : '3px',
            background: i % 2 === 0 ? colors.primary : colors.secondary,
            boxShadow: `0 0 8px 3px ${i % 2 === 0 ? colors.primary : colors.secondary}`,
            animation: `co2Particle ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </>
  );
};
