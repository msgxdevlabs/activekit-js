import React from 'react';

/* link-on-light per DESIGN.md. Teal, body-md, no underline by default. */

export function Link({ children, href = '#', tone = 'primary', underline = 'hover', size = 'md', style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const colors = {
    // --text-link is --primary-deep now, so the hover moves a rung past it,
    // matching what tokens/base.css does to a plain anchor.
    primary: { rest: 'var(--text-link)', hover: 'var(--primary-deeper)' },
    muted: { rest: 'var(--ink-mute)', hover: 'var(--ink)' },
    onDark: { rest: 'rgba(255,255,255,0.72)', hover: 'var(--on-primary)' },
  }[tone] || { rest: 'var(--text-link)', hover: 'var(--primary-deeper)' };

  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: size === 'sm' ? 'var(--caption-size)' : 'var(--body-md-size)',
        fontWeight: 'var(--body-md-weight)',
        lineHeight: 'var(--body-md-lh)',
        letterSpacing: size === 'sm' ? 'var(--caption-ls)' : 'var(--body-md-ls)',
        color: hover ? colors.hover : colors.rest,
        textDecoration: underline === 'always' || (underline === 'hover' && hover) ? 'underline' : 'none',
        textUnderlineOffset: '2px',
        transition: 'color 120ms ease',
        ...style,
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
