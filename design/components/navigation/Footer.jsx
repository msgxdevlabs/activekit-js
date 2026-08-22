import React from 'react';
import { Link } from './Link.jsx';
import { Logo } from '../brand/Logo.jsx';

/* footer-light per DESIGN.md. Canvas background, ink-mute caption type, 64px 24px padding. */

export function Footer({
  brand = 'ActiveKit',
  tagline,
  columns = [],
  legal = '\u00A9 2026 ActiveKit, Inc.',
  legalLinks = [],
  style,
  ...rest
}) {
  return (
    <footer
      style={{
        background: 'var(--canvas)',
        color: 'var(--ink-mute)',
        padding: 'var(--pad-footer)',
        borderTop: 'var(--border-width-hairline) solid var(--hairline)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--caption-size)',
        lineHeight: 'var(--caption-lh)',
        letterSpacing: 'var(--caption-ls)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 'var(--space-huge)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {brand === 'ActiveKit' ? (
              <Logo size="lg" href="#" />
            ) : (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--display-md-size)',
                fontWeight: 700,
                letterSpacing: 'var(--display-md-ls)',
                color: 'var(--ink)',
              }}>{brand}</span>
            )}
            {tagline ? <span style={{ maxWidth: '30ch' }}>{tagline}</span> : null}
          </div>
          {columns.map((col) => (
            <div key={col.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', minWidth: '128px' }}>
              <span style={{
                fontSize: 'var(--micro-cap-size)',
                lineHeight: 'var(--micro-cap-lh)',
                letterSpacing: 'var(--micro-cap-ls)',
                textTransform: 'uppercase',
                color: 'var(--ink-secondary)',
                fontWeight: 500,
              }}>{col.title}</span>
              {col.links.map((l) => (
                <Link key={typeof l === 'string' ? l : l.label} tone="muted" size="sm" href={typeof l === 'string' ? '#' : (l.href || '#')}>
                  {typeof l === 'string' ? l : l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-lg)',
          flexWrap: 'wrap',
          marginTop: 'var(--space-huge)',
          paddingTop: 'var(--space-xl)',
          borderTop: 'var(--border-width-hairline) solid var(--hairline)',
          fontSize: 'var(--micro-size)',
          letterSpacing: 'var(--micro-ls)',
        }}>
          <span>{legal}</span>
          <div style={{ display: 'flex', gap: 'var(--space-lg)' }}>
            {legalLinks.map((l) => (
              <Link key={typeof l === 'string' ? l : l.label} tone="muted" size="sm" href={typeof l === 'string' ? '#' : (l.href || '#')}>
                {typeof l === 'string' ? l : l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
