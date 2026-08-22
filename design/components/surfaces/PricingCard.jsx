import React from 'react';
import { Button } from '../actions/Button.jsx';

/* card-pricing / card-pricing-featured per DESIGN.md.
   Identical structure; `featured` inverts the surface to brand-dark-900. */

export function PricingCard({
  tierName,
  price,
  priceSuffix,
  description,
  features = [],
  ctaLabel = 'Get started',
  ctaHref,
  ctaVariant,
  onCtaClick,
  featured = false,
  footnote,
  style,
  ...rest
}) {
  const fg = featured ? 'var(--text-on-dark)' : 'var(--text-body)';
  const muted = featured ? 'rgba(255,255,255,0.72)' : 'var(--text-mute)';
  const rule = featured ? 'rgba(255,255,255,0.14)' : 'var(--border-hairline)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: featured ? 'var(--surface-dark)' : 'var(--surface-card)',
        color: fg,
        padding: 'var(--pad-card)',
        borderRadius: 'var(--radius-card)',
        border: `var(--border-width-hairline) solid ${featured ? 'transparent' : 'var(--border-hairline)'}`,
        boxShadow: featured ? 'var(--elevation-2)' : 'var(--elevation-1)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          fontSize: 'var(--heading-lg-size)',
          fontWeight: 'var(--heading-lg-weight)',
          lineHeight: 'var(--heading-lg-lh)',
          letterSpacing: 'var(--heading-lg-ls)',
        }}
      >
        {tierName}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-xs)',
          marginTop: 'var(--space-lg)',
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--display-md-size)',
          fontWeight: 'var(--display-md-weight)',
          lineHeight: 'var(--display-md-lh)',
          letterSpacing: 'var(--display-md-ls)',
          fontFeatureSettings: 'var(--font-feature-numeric)',
        }}
      >
        <span>{price}</span>
        {priceSuffix ? (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--caption-size)',
              fontWeight: 'var(--caption-weight)',
              lineHeight: 'var(--caption-lh)',
              letterSpacing: 'var(--caption-ls)',
              color: muted,
            }}
          >
            {priceSuffix}
          </span>
        ) : null}
      </div>
      {description ? (
        <p
          style={{
            marginTop: 'var(--space-md)',
            fontSize: 'var(--body-md-size)',
            fontWeight: 'var(--body-md-weight)',
            lineHeight: 'var(--body-md-lh)',
            letterSpacing: 'var(--body-md-ls)',
            color: muted,
          }}
        >
          {description}
        </p>
      ) : null}
      {features.length ? (
        <ul
          style={{
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            margin: `var(--space-xl) 0 0`,
            padding: `var(--space-xl) 0 0`,
            borderTop: `var(--border-width-hairline) solid ${rule}`,
            fontSize: 'var(--body-md-size)',
            lineHeight: 'var(--body-md-lh)',
            letterSpacing: 'var(--body-md-ls)',
          }}
        >
          {features.map((f) => (
            <li key={typeof f === 'string' ? f : undefined} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'baseline' }}>
              <span
                aria-hidden="true"
                style={{
                  flex: '0 0 auto',
                  width: 'var(--space-xs)',
                  height: 'var(--space-xs)',
                  borderRadius: 'var(--radius-pill)',
                  background: featured ? 'var(--primary-soft)' : 'var(--primary)',
                  transform: 'translateY(-2px)',
                }}
              />
              <span className="ak-tnum">{f}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xl)' }}>
        <Button
          variant={ctaVariant || (featured ? 'primary' : 'secondary')}
          href={ctaHref}
          onClick={onCtaClick}
          fullWidth
        >
          {ctaLabel}
        </Button>
        {footnote ? (
          <div
            style={{
              marginTop: 'var(--space-md)',
              fontSize: 'var(--micro-size)',
              lineHeight: 'var(--micro-lh)',
              letterSpacing: 'var(--micro-ls)',
              color: muted,
              textAlign: 'center',
            }}
          >
            {footnote}
          </div>
        ) : null}
      </div>
    </div>
  );
}
