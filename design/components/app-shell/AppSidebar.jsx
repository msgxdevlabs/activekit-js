import React from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Logo } from '../brand/Logo.jsx';

/* Slate app-shell sidebar. Not in DESIGN.md's component list — an intentional addition so the
   six product templates share one sidebar instead of six copies. See readme "Intentional additions".

   The column carries the brand: a gradient logo tile, a vertical slate ramp, one teal-to-purple
   glow bleeding out of the top-left corner, and a gradient bar on the active item. Icons are
   inferred from the label, so existing templates gain them without changing their props. */

const ICON_BY_LABEL = {
  overview: 'overview', dashboard: 'overview', home: 'overview',
  campaigns: 'campaigns', campaign: 'campaigns',
  ledger: 'ledger', payouts: 'ledger', activity: 'ledger',
  credits: 'credits', billing: 'credits', 'credits and billing': 'credits',
  developers: 'developers', api: 'developers', webhooks: 'developers',
  settings: 'settings', workspace: 'settings',
  team: 'team', members: 'team', audience: 'team',
  reports: 'chart', analytics: 'chart', insights: 'chart',
  docs: 'doc', templates: 'folder', history: 'clock',
};

function iconFor(item, label) {
  if (item && typeof item === 'object' && item.icon) return item.icon;
  return ICON_BY_LABEL[String(label || '').toLowerCase()] || 'chevronRight';
}

function NavItem({ label, href, active, icon, badge }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href || '#'}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-sm) var(--space-md)',
        borderRadius: 'var(--radius-md)',
        background: active ? 'var(--nav-active-gradient)' : (hover ? 'var(--nav-hover-gradient)' : 'transparent'),
        color: active ? 'var(--on-primary)' : (hover ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.70)'),
        fontSize: 'var(--body-md-size)',
        lineHeight: 'var(--body-md-lh)',
        textDecoration: 'none',
        transition: 'var(--transition-interactive)',
      }}
    >
      {active ? (
        <span aria-hidden="true" style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: '2px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--nav-active-bar)',
        }} />
      ) : null}
      <span style={{ color: active ? 'var(--primary-soft)' : 'currentColor', display: 'flex' }}>
        <Icon name={icon} size="md" />
      </span>
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {badge ? (
        <span style={{
          flex: '0 0 auto',
          padding: '1px var(--space-sm)',
          borderRadius: 'var(--radius-pill)',
          background: active ? 'var(--primary-soft)' : 'rgba(255,255,255,0.12)',
          color: active ? 'var(--brand-dark-900)' : 'rgba(255,255,255,0.80)',
          fontSize: 'var(--micro-size)',
          lineHeight: '18px',
          fontFeatureSettings: 'var(--font-feature-numeric)',
        }}>{badge}</span>
      ) : null}
    </a>
  );
}

export function AppSidebar({
  brand = 'ActiveKit',
  workspace,
  items = [],
  meter,
  user,
  footerAction,
  width = '248px',
  style,
  ...rest
}) {
  return (
    <aside
      style={{
        position: 'relative',
        width,
        flex: '0 0 auto',
        background: 'var(--sidebar-gradient)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'var(--sidebar-glow)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', flex: 1, minHeight: 0 }}>
        <div style={{ flex: '0 0 auto', padding: 'var(--space-xs) var(--space-sm)' }}>
          {brand === 'ActiveKit' ? (
            <Logo tone="onDark" />
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <Logo tone="onDark" markOnly />
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--heading-lg-size)',
                fontWeight: 700,
                letterSpacing: 'var(--display-md-ls)',
                lineHeight: 1,
                color: 'var(--on-primary)',
              }}>{brand}</span>
            </span>
          )}
        </div>

        {workspace ? (
          <button type="button" style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            width: '100%',
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--on-primary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--caption-size)',
            letterSpacing: 'var(--caption-ls)',
            textAlign: 'left',
            cursor: 'pointer',
          }}>
            <span aria-hidden="true" style={{
              flex: '0 0 auto',
              width: '22px',
              height: '22px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--cta-gradient)',
              fontSize: 'var(--micro-size)',
              color: 'var(--on-primary)',
            }}>{workspace.initials}</span>
            <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{workspace.name}</span>
            {workspace.plan ? (
              <span style={{
                flex: '0 0 auto',
                padding: '0 var(--space-sm)',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(21,198,188,0.16)',
                color: 'var(--primary-soft)',
                fontSize: 'var(--micro-size)',
                lineHeight: '18px',
              }}>{workspace.plan}</span>
            ) : null}
            <span style={{ color: 'rgba(255,255,255,0.50)', display: 'flex' }}><Icon name="chevronUpDown" size="sm" /></span>
          </button>
        ) : null}

        <nav style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-xxs)', overflowY: 'auto', scrollbarWidth: 'none' }}>
          {items.map((it, i) => {
            if (it && typeof it === 'object' && it.section) {
              return (
                <div key={'s' + i} style={{
                  padding: 'var(--space-md) var(--space-md) var(--space-xs)',
                  fontSize: 'var(--micro-cap-size)',
                  lineHeight: 'var(--micro-cap-lh)',
                  letterSpacing: 'var(--micro-cap-ls)',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.42)',
                }}>{it.section}</div>
              );
            }
            const label = typeof it === 'string' ? it : it.label;
            return (
              <NavItem
                key={label + i}
                label={label}
                href={typeof it === 'object' ? it.href : undefined}
                active={typeof it === 'object' && it.active}
                badge={typeof it === 'object' ? it.badge : undefined}
                icon={iconFor(it, label)}
              />
            );
          })}
        </nav>

        {meter ? (
          <div style={{
            flex: '0 0 auto',
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md)',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--primary-soft)', display: 'flex' }}><Icon name="credits" size="sm" /></span>
              <span style={{
                fontSize: 'var(--micro-cap-size)',
                lineHeight: 'var(--micro-cap-lh)',
                letterSpacing: 'var(--micro-cap-ls)',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.60)',
              }}>{meter.label}</span>
            </div>
            {meter.value ? (
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--display-md-size)',
                fontWeight: 700,
                letterSpacing: 'var(--display-md-ls)',
                color: 'var(--on-primary)',
                fontFeatureSettings: 'var(--font-feature-numeric)',
              }}>{meter.value}</div>
            ) : null}
            {typeof meter.pct === 'number' ? (
              <div style={{ height: '5px', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                <div style={{
                  width: Math.max(0, Math.min(100, meter.pct)) + '%',
                  height: '100%',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--progress-gradient)',
                  transition: 'width var(--dur-slow) var(--ease-out)',
                }} />
              </div>
            ) : null}
            {meter.note ? (
              <div style={{
                fontSize: 'var(--micro-size)',
                lineHeight: 'var(--micro-lh)',
                color: 'rgba(255,255,255,0.60)',
                fontFeatureSettings: 'var(--font-feature-numeric)',
              }}>{meter.note}</div>
            ) : null}
          </div>
        ) : null}

        {user ? (
          <div style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            padding: 'var(--space-sm)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: meter ? undefined : 'auto',
          }}>
            <span style={{
              flex: '0 0 auto',
              width: '30px',
              height: '30px',
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(135deg, var(--purple) 0%, var(--gradient-blue) 100%)',
              color: 'var(--on-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--caption-size)',
              letterSpacing: 'var(--caption-ls)',
            }}>{user.initials}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 'var(--caption-size)',
                letterSpacing: 'var(--caption-ls)',
                color: 'var(--on-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{user.name}</div>
              {user.role ? (
                <div style={{ fontSize: 'var(--micro-size)', color: 'rgba(255,255,255,0.60)' }}>{user.role}</div>
              ) : null}
            </div>
            {footerAction === null ? null : (
              <span style={{ color: 'rgba(255,255,255,0.50)', display: 'flex' }}>
                {footerAction || <Icon name="settings" size="sm" />}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
