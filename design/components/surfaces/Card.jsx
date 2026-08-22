import React from 'react';

/* Surface container per DESIGN.md > Components > Cards & Containers.
   feature = card-feature-light · violet = card-cream-band · mockup = card-dashboard-mockup */

const VARIANTS = {
  feature: {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    padding: 'var(--pad-card)',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--body-md-size)',
    letterSpacing: 'var(--body-md-ls)',
    defaultElevation: '1',
    defaultBorder: true,
  },
  violet: {
    background: 'var(--surface-band-violet)',
    color: 'var(--text-body)',
    padding: 'var(--pad-card)',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--body-md-size)',
    letterSpacing: 'var(--body-md-ls)',
    defaultElevation: '0',
    defaultBorder: false,
  },
  mockup: {
    background: 'var(--surface-card)',
    color: 'var(--text-body)',
    padding: 'var(--pad-card-mockup)',
    borderRadius: 'var(--radius-card)',
    fontSize: 'var(--body-tabular-size)',
    letterSpacing: 'var(--body-tabular-ls)',
    fontFeatureSettings: 'var(--font-feature-numeric)',
    defaultElevation: '2',
    defaultBorder: true,
  },
};

export function Card({
  children,
  variant = 'feature',
  elevation,
  bordered,
  eyebrow,
  title,
  as: Tag = 'div',
  style,
  ...rest
}) {
  const v = VARIANTS[variant] || VARIANTS.feature;
  const level = elevation === undefined ? v.defaultElevation : String(elevation);
  const hasBorder = bordered === undefined ? v.defaultBorder : bordered;

  return (
    <Tag
      style={{
        background: v.background,
        color: v.color,
        padding: v.padding,
        borderRadius: v.borderRadius,
        border: hasBorder
          ? 'var(--border-width-hairline) solid var(--border-hairline)'
          : 'var(--border-width-hairline) solid transparent',
        boxShadow: `var(--elevation-${level})`,
        fontFamily: 'var(--font-sans)',
        fontSize: v.fontSize,
        fontWeight: 'var(--body-md-weight)',
        lineHeight: 'var(--body-md-lh)',
        letterSpacing: v.letterSpacing,
        fontFeatureSettings: v.fontFeatureSettings,
        ...style,
      }}
      {...rest}
    >
      {eyebrow ? (
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--micro-cap-size)',
            fontWeight: 'var(--micro-cap-weight)',
            lineHeight: 'var(--micro-cap-lh)',
            letterSpacing: 'var(--micro-cap-ls)',
            textTransform: 'uppercase',
            color: 'var(--text-mute)',
            marginBottom: 'var(--space-md)',
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      {title ? (
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--display-md-size)',
            fontWeight: 'var(--display-md-weight)',
            lineHeight: 'var(--display-md-lh)',
            letterSpacing: 'var(--display-md-ls)',
            color: 'var(--text-body)',
            margin: `0 0 var(--space-md)`,
          }}
        >
          {title}
        </h3>
      ) : null}
      {children}
    </Tag>
  );
}
