import React from 'react';

/* The signature backdrop: large blurred orbs across the upper third of the page.
   A wash, not a mesh. Keep opacity low and blur wide, or the stops read as bands. */

const ORBS = [
  { w: 46, h: 62, x: -12, y: -30, c: 'var(--wash-orb-aqua)' },
  { w: 30, h: 46, x: 10, y: -18, c: 'var(--wash-orb-teal)' },
  { w: 42, h: 64, x: 34, y: -36, c: 'var(--wash-orb-blue)' },
  { w: 26, h: 40, x: 57, y: -14, c: 'var(--wash-orb-purple)' },
  { w: 44, h: 66, x: 72, y: -32, c: 'var(--wash-orb-lavender)' },
  { w: 24, h: 36, x: 85, y: -10, c: 'var(--wash-orb-purple)' },
];

export function GradientWash({
  children,
  height = 'var(--wash-height)',
  opacity = 0.34,
  blur = 'var(--wash-blur)',
  background = 'var(--canvas)',
  style,
  ...rest
}) {
  return (
    <div style={{ position: 'relative', background, overflow: 'hidden', isolation: 'isolate', ...style }} {...rest}>
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height, pointerEvents: 'none' }}>
        {ORBS.map((o, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: o.x + '%',
            top: o.y + '%',
            width: o.w + '%',
            height: o.h + '%',
            borderRadius: '50%',
            background: o.c,
            filter: 'blur(' + blur + ')',
            opacity,
          }} />
        ))}
      </div>
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}
