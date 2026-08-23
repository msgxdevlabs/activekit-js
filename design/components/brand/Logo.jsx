import React from 'react';

/* The ActiveKit lockup: gradient tile carrying the four-point mark, plus the two-tone wordmark.
   This is the single source for the logo. The mark is the same star path as Icon's `campaigns`
   glyph, filled rather than stroked, so the brand and the product icon set stay one drawing.
   assets/logo.svg is the standalone export of the tile for favicons and external use. */

const MARK = 'M12 3.2l2.1 5.6 5.7 2.1-5.7 2.1-2.1 5.6-2.1-5.6-5.7-2.1 5.7-2.1z';

const SIZES = {
  sm: { tile: 24, radius: 'var(--radius-sm)', font: 'var(--heading-sm-size)', gap: 'var(--space-sm)' },
  md: { tile: 30, radius: 'var(--radius-md)', font: 'var(--heading-lg-size)', gap: 'var(--space-md)' },
  lg: { tile: 40, radius: 'var(--radius-lg)', font: 'var(--display-md-size)', gap: 'var(--space-md)' },
};

export function Logo({
  tone = 'onLight',
  size = 'md',
  markOnly = false,
  lead = 'Active',
  tail = 'Kit',
  href,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const onDark = tone === 'onDark';

  const tile = (
    <span aria-hidden="true" style={{
      flex: '0 0 auto',
      width: s.tile,
      height: s.tile,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: s.radius,
      /* The brand ramp, not the CTA one. The lockup carries no text, so the
         contrast pass that moved --cta-gradient-bold onto legible stops has no
         claim on the mark, and following it would have darkened the tile in the
         dashboard while the landing page's own lockup literal stayed bright.
         Naming --brand-gradient-button here keeps the two identical by
         definition rather than by coincidence. */
      background: 'var(--brand-gradient-button)',
      boxShadow: 'var(--elevation-cta)',
    }}>
      <svg width={s.tile * 0.66} height={s.tile * 0.66} viewBox="0 0 24 24" fill="none">
        <path d={MARK} fill="var(--on-primary)" />
      </svg>
    </span>
  );

  const Tag = href ? 'a' : 'span';

  return (
    <Tag
      href={href}
      aria-label={markOnly ? lead + tail : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        textDecoration: 'none',
        ...style,
      }}
      {...rest}
    >
      {tile}
      {markOnly ? null : (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: s.font,
          fontWeight: 700,
          letterSpacing: 'var(--display-md-ls)',
          lineHeight: 1,
          color: onDark ? 'var(--on-primary)' : 'var(--ink)',
          whiteSpace: 'nowrap',
        }}>
          {lead}<span style={{ color: onDark ? 'var(--primary-soft)' : 'var(--purple)' }}>{tail}</span>
        </span>
      )}
    </Tag>
  );
}
