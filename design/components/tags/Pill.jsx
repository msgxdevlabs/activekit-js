import React from 'react';

/* pill-tag-soft per DESIGN.md > Pills, Tags, and Chips.
   micro-cap type, 4px 8px padding, pill radius, pale teal fill. */

const TONES = {
  soft: { background: 'var(--surface-tag)', color: 'var(--text-tag)', borderColor: 'transparent' },
  outline: { background: 'var(--canvas)', color: 'var(--primary-deep)', borderColor: 'var(--hairline)' },
  onDark: { background: 'rgba(255,255,255,0.10)', color: 'var(--primary-soft)', borderColor: 'transparent' },
};

export function Pill({ children, tone = 'soft', dot = false, style, ...rest }) {
  const skin = TONES[tone] || TONES.soft;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        background: skin.background,
        color: skin.color,
        border: 'var(--border-width-hairline) solid ' + skin.borderColor,
        borderRadius: 'var(--radius-tag)',
        padding: 'var(--pad-tag)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--micro-cap-size)',
        fontWeight: 'var(--micro-cap-weight)',
        lineHeight: 'var(--micro-cap-lh)',
        letterSpacing: 'var(--micro-cap-ls)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot ? (
        <span aria-hidden="true" style={{
          width: 'var(--space-xs)',
          height: 'var(--space-xs)',
          borderRadius: 'var(--radius-pill)',
          background: tone === 'onDark' ? 'var(--primary-soft)' : 'var(--primary)',
        }} />
      ) : null}
      {children}
    </span>
  );
}
