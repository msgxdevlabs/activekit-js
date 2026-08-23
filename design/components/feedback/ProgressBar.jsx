import React from 'react';

/* Progress. Determinate when you know the count (uploads, imports, credit caps), indeterminate
   when you do not (an API call in flight). The fill carries the teal → blue ramp, so progress is
   the one place a gradient moves. */

const HEIGHTS = { sm: '4px', md: '6px', lg: '10px' };

export function ProgressBar({
  value,
  label,
  hint,
  showValue = false,
  size = 'md',
  tone = 'light',
  style,
  ...rest
}) {
  const dark = tone === 'dark';
  const indeterminate = value === null || value === undefined;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, value));
  const height = HEIGHTS[size] || HEIGHTS.md;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontFamily: 'var(--font-sans)', ...style }} {...rest}>
      {(label || showValue) ? (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
          <span style={{
            fontSize: 'var(--body-tabular-size)',
            lineHeight: 'var(--body-tabular-lh)',
            color: dark ? 'rgba(255,255,255,0.80)' : 'var(--ink-secondary)',
          }}>{label}</span>
          {showValue && !indeterminate ? (
            <span style={{
              fontSize: 'var(--caption-size)',
              letterSpacing: 'var(--caption-ls)',
              fontFeatureSettings: 'var(--font-feature-numeric)',
              color: dark ? 'rgba(255,255,255,0.64)' : 'var(--ink-mute)',
            }}>{pct}%</span>
          ) : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height,
          borderRadius: 'var(--radius-pill)',
          background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(31,63,94,0.10)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {indeterminate ? (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--progress-gradient)',
            transformOrigin: 'left center',
            animation: 'ak-indeterminate var(--dur-progress) var(--ease-standard) infinite',
          }} />
        ) : (
          <div style={{
            width: pct + '%',
            height: '100%',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--progress-gradient)',
            transition: 'width var(--dur-slow) var(--ease-out)',
          }} />
        )}
      </div>

      {hint ? (
        <div style={{
          fontSize: 'var(--micro-size)',
          lineHeight: 'var(--micro-lh)',
          fontFeatureSettings: 'var(--font-feature-numeric)',
          color: dark ? 'rgba(255,255,255,0.60)' : 'var(--ink-mute-2)',
        }}>{hint}</div>
      ) : null}
    </div>
  );
}
