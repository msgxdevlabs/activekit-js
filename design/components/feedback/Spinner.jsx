import React from 'react';

/* The one indeterminate loader. A teal ring with a lit head, 720ms linear.
   Keeps spinning under prefers-reduced-motion, because a frozen spinner reads as a hung app. */

const SIZES = { sm: 16, md: 20, lg: 28, xl: 40 };
const WEIGHTS = { sm: 2, md: 2, lg: 2.5, xl: 3 };

const TONES = {
  primary: { track: 'rgba(0,167,160,0.20)', head: 'var(--primary)' },
  brand: { track: 'rgba(107,76,246,0.18)', head: 'var(--purple)' },
  onDark: { track: 'rgba(255,255,255,0.18)', head: 'var(--primary-soft)' },
  neutral: { track: 'rgba(31,63,94,0.14)', head: 'var(--ink-mute)' },
};

export function Spinner({ size = 'md', tone = 'primary', label, style, ...rest }) {
  const px = typeof size === 'number' ? size : (SIZES[size] || SIZES.md);
  const weight = typeof size === 'number' ? Math.max(2, Math.round(px / 9)) : (WEIGHTS[size] || 2);
  const t = TONES[tone] || TONES.primary;

  const ring = (
    <span aria-hidden="true" style={{
      width: px,
      height: px,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      border: weight + 'px solid ' + t.track,
      borderTopColor: t.head,
      animation: 'ak-spin var(--dur-spin) linear infinite',
    }} />
  );

  if (!label) {
    return <span role="status" aria-label="Loading" style={{ display: 'inline-flex', ...style }} {...rest}>{ring}</span>;
  }
  return (
    <span
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--body-tabular-size)',
        lineHeight: 'var(--body-tabular-lh)',
        color: tone === 'onDark' ? 'rgba(255,255,255,0.72)' : 'var(--ink-mute)',
        ...style,
      }}
      {...rest}
    >
      {ring}{label}
    </span>
  );
}
