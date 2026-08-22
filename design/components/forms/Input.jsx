import React from 'react';

/* text-input / text-input-focused per DESIGN.md > Inputs & Forms.
   6px radius, 8px 12px padding, hairline-input border, teal border on focus. */

export function Input({
  label,
  hint,
  error,
  id,
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  focused = false,
  numeric = false,
  prefix,
  suffix,
  fullWidth = true,
  onChange,
  style,
  ...rest
}) {
  const [isFocus, setFocus] = React.useState(false);
  const active = focused || isFocus;
  const inputId = id || React.useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: fullWidth ? '100%' : undefined, ...style }}>
      {label ? (
        <label htmlFor={inputId} style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--caption-size)',
          lineHeight: 'var(--caption-lh)',
          letterSpacing: 'var(--caption-ls)',
          fontWeight: 500,
          color: 'var(--ink-secondary)',
        }}>{label}</label>
      ) : null}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        background: 'var(--canvas)',
        color: 'var(--ink)',
        padding: 'var(--pad-input)',
        minHeight: '40px',
        borderRadius: 'var(--radius-input)',
        border: 'var(--border-width-hairline) solid ' + (error ? 'var(--ruby)' : active ? 'var(--border-focus)' : 'var(--border-input)'),
        opacity: disabled ? 0.4 : 1,
        transition: 'border-color 120ms ease',
      }}>
        {prefix ? <span style={{ color: 'var(--ink-mute)', fontSize: 'var(--body-md-size)' }}>{prefix}</span> : null}
        <input
          id={inputId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
            fontSize: numeric ? 'var(--body-tabular-size)' : 'var(--body-md-size)',
            fontWeight: 'var(--body-md-weight)',
            lineHeight: 'var(--body-md-lh)',
            letterSpacing: numeric ? 'var(--body-tabular-ls)' : 'var(--body-md-ls)',
            fontFeatureSettings: numeric ? 'var(--font-feature-numeric)' : undefined,
          }}
          {...rest}
        />
        {suffix ? <span style={{ color: 'var(--ink-mute)', fontSize: 'var(--caption-size)' }}>{suffix}</span> : null}
      </div>
      {error || hint ? (
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--caption-size)',
          lineHeight: 'var(--caption-lh)',
          letterSpacing: 'var(--caption-ls)',
          /* The border turns ruby; the words do not. --ruby is 3.33:1 on
             --canvas, which clears the 3:1 floor a border answers to and misses
             the 4.5:1 one a sentence answers to, and an error message is the
             half of this state a person has to read. --text-body is 16.45:1 on
             the same ground, and against the --ink-mute hint it replaces it is
             a visible step up in weight at the same size, so the slot still
             changes when the state does. Ruby stays a tint and a glyph, which
             is the position readme.md holds everywhere else in the system. */
          color: error ? 'var(--text-body)' : 'var(--ink-mute)',
        }}>{error || hint}</div>
      ) : null}
    </div>
  );
}
