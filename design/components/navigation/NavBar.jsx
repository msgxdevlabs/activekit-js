import React from 'react';
import { Button } from '../actions/Button.jsx';
import { Link } from './Link.jsx';
import { Logo } from '../brand/Logo.jsx';

/* nav-bar-on-mesh per DESIGN.md. Wordmark left, nav centre, sign-in plus one filled pill right.
   Sits over the gradient wash, so the default background is transparent. */

export function NavBar({
  brand = 'ActiveKit',
  items = [],
  activeItem,
  signInLabel = 'Sign in',
  ctaLabel = 'Start free',
  onSignIn,
  onCta,
  onDark = false,
  transparent = true,
  style,
  ...rest
}) {
  const ink = onDark ? 'var(--on-primary)' : 'var(--ink)';
  const muted = onDark ? 'rgba(255,255,255,0.72)' : 'var(--ink-mute-2)';

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xl)',
        padding: 'var(--pad-nav)',
        background: transparent ? 'transparent' : (onDark ? 'var(--surface-dark)' : 'var(--canvas)'),
        borderBottom: transparent ? 'none' : 'var(--border-width-hairline) solid ' + (onDark ? 'rgba(255,255,255,0.10)' : 'var(--hairline)'),
        borderRadius: transparent ? 'var(--radius-xs)' : 0,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      {brand === 'ActiveKit' ? (
        <Logo tone={onDark ? 'onDark' : 'onLight'} href="#" />
      ) : (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--heading-lg-size)',
          fontWeight: 700,
          letterSpacing: 'var(--display-md-ls)',
          color: ink,
          whiteSpace: 'nowrap',
        }}>{brand}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', flex: 1, justifyContent: 'center' }}>
        {items.map((it) => {
          const label = typeof it === 'string' ? it : it.label;
          const href = typeof it === 'string' ? '#' : (it.href || '#');
          const isActive = activeItem === label;
          return (
            <a key={label} href={href} style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--body-md-size)',
              lineHeight: 'var(--body-md-lh)',
              letterSpacing: 'var(--body-md-ls)',
              color: isActive ? ink : muted,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>{label}</a>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        {signInLabel ? (
          <Link tone={onDark ? 'onDark' : 'muted'} underline="hover" onClick={onSignIn} href="#">{signInLabel}</Link>
        ) : null}
        {ctaLabel ? <Button variant={onDark ? 'primary' : 'primary'} size="sm" onClick={onCta}>{ctaLabel}</Button> : null}
      </div>
    </nav>
  );
}
