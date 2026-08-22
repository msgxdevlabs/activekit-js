import React from 'react';

/* Pill buttons per DESIGN.md > Components > Buttons.
   Geometry is identical across variants: radius-pill + 8px 16px padding (md) / 8px 12px (sm).
   Fills carry the brand gradient: `primary` runs a teal-only ramp (deep → deeper) so it reads as
   one colour with depth, `brand` runs the full teal → blue → purple ramp and is capped at one
   per view. Press flattens to a solid, because a pressed control should look pressed, not lit.

   Every fill sits at or below --primary-deep and every label is a token whose pair with its
   ground clears 4.5:1. Both ramps used to open on stops where white measures 2.14:1 and 2.99:1,
   and the outline and ghost labels used to be --primary-deep on a tint that reads 4.40:1. The
   values moved in tokens/, not here; what changed in this file is which token each slot names. */

const SIZES = {
  md: {
    fontSize: 'var(--button-md-size)',
    lineHeight: 'var(--button-md-lh)',
    letterSpacing: 'var(--button-md-ls)',
    padding: 'var(--pad-button)',
    gap: 'var(--space-sm)',
    spinner: 15,
  },
  sm: {
    fontSize: 'var(--button-sm-size)',
    lineHeight: 'var(--button-sm-lh)',
    letterSpacing: 'var(--button-sm-ls)',
    padding: 'var(--space-sm) var(--space-md)',
    gap: 'var(--space-xs)',
    spinner: 13,
  },
};

const VARIANTS = {
  primary: {
    rest: { background: 'var(--cta-gradient)', color: 'var(--cta-on-fill)', borderColor: 'transparent', shadow: 'var(--elevation-cta)' },
    hover: { background: 'var(--cta-gradient-hover)', color: 'var(--cta-on-fill)', borderColor: 'transparent', shadow: 'var(--elevation-cta-hover)' },
    press: { background: 'var(--cta-fill-press)', color: 'var(--cta-on-fill)', borderColor: 'transparent', shadow: 'var(--elevation-0)' },
    track: 'rgba(255,255,255,0.34)',
  },
  brand: {
    rest: { background: 'var(--cta-gradient-bold)', color: 'var(--cta-on-fill)', borderColor: 'transparent', shadow: 'var(--elevation-cta)' },
    hover: { background: 'var(--cta-gradient-bold-hover)', color: 'var(--cta-on-fill)', borderColor: 'transparent', shadow: 'var(--elevation-cta-hover)' },
    press: { background: 'var(--cta-gradient-bold-press)', color: 'var(--cta-on-fill)', borderColor: 'transparent', shadow: 'var(--elevation-0)' },
    track: 'rgba(255,255,255,0.34)',
  },
  secondary: {
    rest: { background: 'var(--cta-gradient-quiet)', color: 'var(--cta-on-subdued)', borderColor: 'var(--primary)', shadow: 'var(--elevation-0)' },
    hover: { background: 'var(--cta-fill-subdued)', color: 'var(--cta-on-subdued)', borderColor: 'var(--primary-deeper)', shadow: 'var(--elevation-1)' },
    press: { background: 'var(--cta-fill-subdued)', color: 'var(--primary-deepest)', borderColor: 'var(--primary-deepest)', shadow: 'var(--elevation-0)' },
    track: 'rgba(0,167,160,0.26)',
  },
  onDark: {
    rest: { background: 'var(--surface-dark-gradient)', color: 'var(--on-primary)', borderColor: 'rgba(255,255,255,0.16)', shadow: 'var(--elevation-0)' },
    hover: { background: 'linear-gradient(135deg, #1e3050 0%, var(--brand-dark-700) 100%)', color: 'var(--on-primary)', borderColor: 'rgba(255,255,255,0.28)', shadow: 'var(--elevation-1)' },
    press: { background: 'var(--brand-dark-950)', color: 'var(--on-primary)', borderColor: 'rgba(255,255,255,0.16)', shadow: 'var(--elevation-0)' },
    track: 'rgba(255,255,255,0.28)',
  },
  ghost: {
    rest: { background: 'transparent', color: 'var(--ink-secondary)', borderColor: 'transparent', shadow: 'var(--elevation-0)' },
    hover: { background: 'var(--cta-fill-subdued)', color: 'var(--cta-on-subdued)', borderColor: 'transparent', shadow: 'var(--elevation-0)' },
    press: { background: 'var(--cta-fill-subdued)', color: 'var(--primary-deepest)', borderColor: 'transparent', shadow: 'var(--elevation-0)' },
    track: 'rgba(0,167,160,0.26)',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  disabled = false,
  pressed = false,
  loading = false,
  loadingLabel,
  fullWidth = false,
  href,
  onClick,
  type = 'button',
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const inert = disabled || loading;
  const phase = inert ? 'rest' : (pressed || down ? 'press' : hover ? 'hover' : 'rest');
  const skin = v[phase];

  const buttonStyles = {
    position: 'relative',
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--button-md-weight)',
    fontSize: s.fontSize,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing,
    padding: s.padding,
    minHeight: '40px',
    borderRadius: 'var(--radius-button)',
    border: `var(--border-width-hairline) solid ${skin.borderColor}`,
    background: skin.background,
    boxShadow: skin.shadow,
    color: skin.color,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    cursor: disabled ? 'not-allowed' : (loading ? 'progress' : 'pointer'),
    opacity: disabled ? 0.4 : 1,
    transition: 'var(--transition-interactive)',
    ...style,
  };

  const spinner = (
    <span aria-hidden="true" style={{
      width: s.spinner,
      height: s.spinner,
      flex: '0 0 auto',
      borderRadius: 'var(--radius-pill)',
      border: '2px solid ' + v.track,
      borderTopColor: 'currentColor',
      animation: 'ak-spin var(--dur-spin) linear infinite',
    }} />
  );

  const content = loading
    ? (<>{spinner}{loadingLabel || children}</>)
    : (<>{iconLeft}{children}{iconRight}</>);

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => { setHover(false); setDown(false); },
    onMouseDown: () => setDown(true),
    onMouseUp: () => setDown(false),
    onBlur: () => setDown(false),
  };

  if (href && !inert) {
    return (
      <a href={href} style={buttonStyles} onClick={onClick} {...handlers} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button
      type={type}
      style={buttonStyles}
      disabled={inert}
      aria-busy={loading || undefined}
      onClick={onClick}
      {...handlers}
      {...rest}
    >
      {content}
    </button>
  );
}
