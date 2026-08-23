import React from 'react';
import { Icon } from '../icons/Icon.jsx';

/* Modals, confirms, and prompts. One shell, four tones. The gradient rule across the top is the
   only brand colour on the panel, which is what lets a destructive dialog stay ruby without the
   surrounding chrome arguing with it. */

const SIZES = { sm: '400px', md: '520px', lg: '680px' };

const TONES = {
  brand: { rule: 'var(--cta-gradient-bold)', medallion: 'var(--medallion-gradient)', icon: 'var(--primary-deep)', border: 'var(--border-hairline)' },
  neutral: { rule: 'linear-gradient(90deg, var(--hairline) 0%, var(--hairline) 100%)', medallion: 'var(--surface-page)', icon: 'var(--ink-secondary)', border: 'var(--border-hairline)' },
  danger: { rule: 'linear-gradient(135deg, var(--ruby) 0%, var(--purple) 100%)', medallion: 'var(--surface-danger)', icon: 'var(--ruby)', border: 'var(--border-danger)' },
  success: { rule: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--primary) 100%)', medallion: 'var(--cta-fill-subdued)', icon: 'var(--primary-deep)', border: 'var(--border-hairline)' },
};

export function Modal({
  open = true,
  title,
  description,
  children,
  icon,
  tone = 'brand',
  size = 'md',
  actions,
  footnote,
  onClose,
  dismissible = true,
  inline = false,
  style,
  ...rest
}) {
  if (!open) return null;
  const t = TONES[tone] || TONES.brand;
  const glyph = typeof icon === 'string' ? <Icon name={icon} size="lg" /> : icon;

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: SIZES[size] || SIZES.md,
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--elevation-modal)',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        animation: 'ak-modal-in var(--dur-slow) var(--ease-out)',
        ...style,
      }}
      {...rest}
    >
      <div aria-hidden="true" style={{ height: '3px', background: t.rule }} />

      <div style={{ display: 'flex', gap: 'var(--space-lg)', padding: 'var(--space-xl) var(--space-xl) 0' }}>
        {icon ? (
          <div style={{
            flex: '0 0 auto',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            background: t.medallion,
            border: 'var(--border-width-hairline) solid ' + t.border,
            color: t.icon,
          }}>{glyph}</div>
        ) : null}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', paddingRight: dismissible ? 'var(--space-xl)' : 0 }}>
          {title ? (
            <h2 style={{
              fontSize: 'var(--heading-md-size)',
              fontWeight: 'var(--heading-md-weight)',
              lineHeight: 'var(--heading-md-lh)',
              letterSpacing: 'var(--heading-md-ls)',
              color: 'var(--text-body)',
            }}>{title}</h2>
          ) : null}
          {description ? (
            <p style={{
              fontSize: 'var(--body-md-size)',
              lineHeight: 'var(--body-md-lh)',
              color: 'var(--text-mute)',
              textWrap: 'pretty',
            }}>{description}</p>
          ) : null}
        </div>

        {dismissible ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 'var(--space-lg)',
              right: 'var(--space-lg)',
              width: '28px',
              height: '28px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              color: 'var(--ink-mute)',
              cursor: 'pointer',
              transition: 'var(--transition-interactive)',
            }}
          >
            <Icon name="close" size="sm" />
          </button>
        ) : null}
      </div>

      {children ? (
        <div style={{ padding: 'var(--space-lg) var(--space-xl) 0', color: 'var(--text-secondary)' }}>{children}</div>
      ) : null}

      {(actions || footnote) ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: footnote ? 'space-between' : 'flex-end',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-xl)',
          padding: 'var(--space-lg) var(--space-xl)',
          borderTop: 'var(--border-width-hairline) solid var(--border-hairline)',
          background: 'var(--surface-page)',
        }}>
          {footnote ? (
            <span style={{
              fontSize: 'var(--micro-size)',
              lineHeight: 'var(--micro-lh)',
              color: 'var(--text-mute-2)',
            }}>{footnote}</span>
          ) : null}
          {actions ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>{actions}</div>
          ) : null}
        </div>
      ) : <div style={{ height: 'var(--space-xl)' }} />}
    </div>
  );

  return (
    <div
      style={{
        position: inline ? 'relative' : 'fixed',
        inset: 0,
        zIndex: inline ? undefined : 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-xl)',
        background: 'var(--scrim-modal)',
        animation: 'ak-scrim-in var(--dur-base) ease',
      }}
      onClick={dismissible && onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      {panel}
    </div>
  );
}
