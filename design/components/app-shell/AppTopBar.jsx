import React from 'react';

/* White page header for the product shell: eyebrow, title, right-hand actions, optional tab row.
   An intentional addition, like AppSidebar. */

export function AppTopBar({ eyebrow, title, children, below, style, ...rest }) {
  return (
    <header
      style={{
        background: 'var(--canvas)',
        borderBottom: 'var(--border-width-hairline) solid var(--border-hairline)',
        padding: below ? 'var(--space-lg) var(--space-xl) 0' : 'var(--pad-nav)',
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div>
          {eyebrow ? (
            <div style={{
              fontSize: 'var(--micro-cap-size)',
              lineHeight: 'var(--micro-cap-lh)',
              letterSpacing: 'var(--micro-cap-ls)',
              textTransform: 'uppercase',
              color: 'var(--text-mute)',
            }}>{eyebrow}</div>
          ) : null}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--display-md-size)',
            fontWeight: 'var(--display-md-weight)',
            lineHeight: 'var(--display-md-lh)',
            letterSpacing: 'var(--display-md-ls)',
            color: 'var(--text-body)',
          }}>{title}</div>
        </div>
        {children ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>{children}</div>
        ) : null}
      </div>
      {below ? <div style={{ display: 'flex', gap: 'var(--space-xl)', marginTop: 'var(--space-lg)' }}>{below}</div> : null}
    </header>
  );
}
