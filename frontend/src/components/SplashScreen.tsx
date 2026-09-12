import React, { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Lock scroll while splash is active
    document.body.style.overflow = 'hidden';

    // Phase timeline
    // 0ms   → enter (glow + logo fade-in + ring + tagline)
    // 1800ms → hold briefly
    // 2200ms → exit (fade + scale out)
    // 2900ms → unmount & unlock scroll

    const holdTimer = setTimeout(() => setPhase('hold'), 1800);
    const exitTimer = setTimeout(() => setPhase('exit'), 2200);
    const doneTimer = setTimeout(() => {
      document.body.style.overflow = '';
      onComplete();
    }, 2900);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      document.body.style.overflow = '';
    };
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      className={`splash-root${phase === 'exit' ? ' splash-exit' : ''}`}
    >
      {/* Ambient background glow */}
      <div className="splash-glow-bg" />

      {/* Rotating ring behind logo */}
      <div className="splash-center">
        <div className="splash-ring-wrap">
          <svg
            className="splash-ring"
            viewBox="0 0 220 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* outer dashed orbit */}
            <circle
              cx="110" cy="110" r="104"
              stroke="#10b981"
              strokeWidth="0.8"
              strokeDasharray="6 10"
              opacity="0.35"
            />
            {/* inner solid thin ring */}
            <circle
              cx="110" cy="110" r="96"
              stroke="#10b981"
              strokeWidth="1.2"
              strokeDasharray="280 40"
              strokeLinecap="round"
              opacity="0.6"
            />
            {/* glowing dot on ring */}
            <circle cx="110" cy="14" r="3.5" fill="#34d399"
              style={{ filter: 'drop-shadow(0 0 6px #10b981)' }} />
          </svg>
        </div>

        {/* Glow pulse disc */}
        <div className="splash-pulse" />

        {/* Logo */}
        <div className="splash-logo-wrap">
          <img
            src="/recarbo-logo.png"
            alt="ReCarbo"
            className="splash-logo"
            draggable={false}
          />
        </div>
      </div>

      {/* Tagline */}
      <p className="splash-tagline">
        CAPTURE.&nbsp;&nbsp;CONNECT.&nbsp;&nbsp;REUSE.
      </p>

      {/* Thin bottom progress line */}
      <div className="splash-progress" />
    </div>
  );
};
