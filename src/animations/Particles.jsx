import React from 'react';

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: (i * 61) % 96 + 2,
  top: (i * 37) % 92 + 3,
  size: 3 + ((i * 13) % 5),
  delay: (i * 730) % 5200,
  duration: 4200 + ((i * 617) % 3600)
}));

export default function Particles({ enabled = true }) {
  if (!enabled) return null;
  return (
    <div className="particle-layer" aria-hidden="true">
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`
          }}
        />
      ))}
    </div>
  );
}
