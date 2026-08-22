import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/* Empty states. A branded medallion, a sentence that says what is missing, a sentence that says
   what to do, and the action that does it. The medallion is where the gradient wash appears at
   component scale, which is what keeps an empty page on-brand instead of merely blank.

   tone="danger" is the fourth kind this component's prompt file already names, the region that is
   empty because a request failed. It swaps the medallion for the ruby one Modal's danger tone
   already draws and drops the glow, because the glow is the brand wash and a failure is not
   carrying brand. Nothing else moves: the frame, the type and the text colors stay, so a failed
   list still reads as the same component rather than as an alarm. */

const SIZES = {
  sm: { pad: 'var(--space-xl)', medallion: 44, icon: 20, title: 'var(--heading-sm-size)', gap: 'var(--space-sm)' },
  md: { pad: 'var(--space-xxl)', medallion: 56, icon: 24, title: 'var(--heading-md-size)', gap: 'var(--space-md)' },
  lg: { pad: 'var(--space-huge) var(--space-xxl)', medallion: 72, icon: 28, title: 'var(--heading-lg-size)', gap: 'var(--space-md)' },
};

const FRAMES = {
  none: {},
  dashed: { border: '1px dashed var(--border-hairline)', borderRadius: 'var(--radius-card)', background: 'var(--surface-page)' },
  card: { border: 'var(--border-width-hairline) solid var(--border-hairline)', borderRadius: 'var(--radius-card)', background: 'var(--surface-card)', boxShadow: 'var(--elevation-1)' },
};

const DARK_FRAMES = {
  none: {},
  dashed: { border: '1px dashed rgba(255,255,255,0.16)', borderRadius: 'var(--radius-card)', background: 'rgba(255,255,255,0.03)' },
  card: { border: '1px solid rgba(255,255,255,0.10)', borderRadius: 'var(--radius-card)', background: 'rgba(255,255,255,0.05)' },
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actions,
  hint,
  size = 'md',
  tone = 'light',
  frame = 'none',
  align = 'center',
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const dark = tone === 'dark';
  const danger = tone === 'danger';
  const frameStyle = (dark ? DARK_FRAMES : FRAMES)[frame] || {};
  const centered = align === 'center';
  const glyph = typeof icon === 'string' ? <Icon name={icon} size={s.icon} /> : icon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start',
        textAlign: centered ? 'center' : 'left',
        gap: s.gap,
        padding: s.pad,
        fontFamily: 'var(--font-sans)',
        ...frameStyle,
        ...style,
      }}
      {...rest}
    >
      {icon !== null ? (
        <div style={{ position: 'relative', marginBottom: 'var(--space-xs)' }}>
          {danger ? null : (
            <div aria-hidden="true" style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: s.medallion * 2,
              height: s.medallion * 2,
              background: 'var(--medallion-glow)',
              pointerEvents: 'none',
            }} />
          )}
          <div style={{
            position: 'relative',
            width: s.medallion,
            height: s.medallion,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-mockup)',
            background: dark ? 'rgba(255,255,255,0.07)' : danger ? 'var(--surface-danger)' : 'var(--medallion-gradient)',
            border: dark
              ? '1px solid rgba(255,255,255,0.12)'
              : danger
                ? 'var(--border-width-hairline) solid var(--border-danger)'
                : 'var(--border-width-hairline) solid var(--border-hairline)',
            color: dark ? 'var(--primary-soft)' : danger ? 'var(--text-danger)' : 'var(--primary-deep)',
          }}>
            {glyph}
          </div>
        </div>
      ) : null}

      {title ? (
        <h3 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: s.title,
          fontWeight: 'var(--heading-md-weight)',
          lineHeight: 'var(--heading-md-lh)',
          letterSpacing: 'var(--heading-md-ls)',
          color: dark ? 'var(--on-primary)' : 'var(--text-body)',
        }}>{title}</h3>
      ) : null}

      {description ? (
        <p style={{
          maxWidth: '46ch',
          fontSize: 'var(--body-md-size)',
          lineHeight: 'var(--body-md-lh)',
          color: dark ? 'rgba(255,255,255,0.68)' : 'var(--text-mute)',
          textWrap: 'pretty',
        }}>{description}</p>
      ) : null}

      {actions ? (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: centered ? 'center' : 'flex-start',
          gap: 'var(--space-md)',
          paddingTop: 'var(--space-sm)',
        }}>{actions}</div>
      ) : null}

      {hint ? (
        <div style={{
          fontSize: 'var(--micro-size)',
          lineHeight: 'var(--micro-lh)',
          color: dark ? 'rgba(255,255,255,0.52)' : 'var(--text-mute-2)',
        }}>{hint}</div>
      ) : null}
    </div>
  );
}
