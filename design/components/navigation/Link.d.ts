import type * as React from 'react';

/** Inline link. Teal on light surfaces, no underline at rest. */
export interface LinkProps {
  children?: React.ReactNode;
  href?: string;
  /** primary = teal · muted = ink-mute for footers and fine print · onDark = translucent white on slate. */
  tone?: 'primary' | 'muted' | 'onDark';
  /** hover (default), always, or none. */
  underline?: 'hover' | 'always' | 'none';
  /** md = body-md 15px · sm = caption 13px. */
  size?: 'md' | 'sm';
  style?: React.CSSProperties;
}

export declare function Link(props: LinkProps): JSX.Element;
