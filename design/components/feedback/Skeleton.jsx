import React from 'react';

/* Skeletons hold the shape of content that is arriving. Shimmer runs left to right at 1500ms
   on a hairline-coloured base, so a loading page keeps the same rhythm as the loaded one. */

const VARIANTS = {
  text: { height: '12px', radius: 'var(--radius-xs)', width: '100%' },
  title: { height: '22px', radius: 'var(--radius-sm)', width: '42%' },
  metric: { height: '34px', radius: 'var(--radius-sm)', width: '58%' },
  pill: { height: '28px', radius: 'var(--radius-pill)', width: '96px' },
  avatar: { height: '32px', radius: 'var(--radius-pill)', width: '32px' },
  block: { height: '96px', radius: 'var(--radius-card)', width: '100%' },
  chart: { height: '148px', radius: 'var(--radius-card)', width: '100%' },
};

function Bar({ variant, width, height, radius, tone, animated, style }) {
  const v = VARIANTS[variant] || VARIANTS.text;
  const dark = tone === 'dark';
  return (
    <span
      data-ak-decorative-motion="true"
      style={{
        display: 'block',
        width: width || v.width,
        height: height || v.height,
        borderRadius: radius || v.radius,
        backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(31,63,94,0.09)',
        backgroundImage: animated ? (dark ? 'var(--shimmer-gradient-dark)' : 'var(--shimmer-gradient)') : 'none',
        backgroundSize: '220% 100%',
        backgroundRepeat: 'no-repeat',
        animation: animated ? 'ak-shimmer var(--dur-shimmer) var(--ease-standard) infinite' : 'none',
        ...style,
      }}
    />
  );
}

export function Skeleton({
  variant = 'text',
  lines = 1,
  width,
  height,
  radius,
  gap = 'var(--space-sm)',
  tone = 'light',
  animated = true,
  style,
  ...rest
}) {
  if (lines > 1) {
    return (
      <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap, width: width || '100%', ...style }} {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <Bar
            key={i}
            variant={variant}
            width={i === lines - 1 ? '64%' : '100%'}
            height={height}
            radius={radius}
            tone={tone}
            animated={animated}
          />
        ))}
      </span>
    );
  }
  return (
    <span aria-hidden="true" style={{ display: 'block', ...style }} {...rest}>
      <Bar variant={variant} width={width} height={height} radius={radius} tone={tone} animated={animated} />
    </span>
  );
}
