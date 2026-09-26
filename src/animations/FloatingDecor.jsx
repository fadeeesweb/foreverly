import React from 'react';
import { asset, isReducedMotion } from '../utils/helpers';

const MAX_ACTIVE = 28;

/**
 * Lightweight floating decoration engine.
 * Transform/opacity only, capped element count, randomised delays.
 */
export default function FloatingDecor({ decorations = [], enabled = true, themeId }) {
  if (!enabled || !decorations.length) return null;
  const reduced = isReducedMotion();
  const active = decorations.filter((d) => d.enabled !== false && d.src).slice(0, MAX_ACTIVE);

  return (
    <div className="float-layer" aria-hidden="true" data-theme={themeId}>
      {active.map((d) => {
        const src = /^data:|^(https?:)?\/\//i.test(d.src) ? d.src : asset(d.src);
        return (
          <img
            key={d.id}
            className={`float-item float-${reduced ? 'none' : d.animation || 'float'}`}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              left: `${d.position?.x ?? 12}%`,
              top: `${d.position?.y ?? 20}%`,
              width: `${d.size || 32}px`,
              opacity: (d.opacity ?? 0.7) * (reduced ? 0.6 : 1),
              transform: `rotate(${d.rotate || 0}deg)`,
              animationDelay: `${d.delay || 0}ms`
            }}
          />
        );
      })}
    </div>
  );
}
