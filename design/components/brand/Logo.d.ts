import type * as React from 'react';

/** The ActiveKit lockup: gradient tile with the four-point mark, plus the two-tone wordmark. The single source for the logo. */
export interface LogoProps {
  /** onLight = ink wordmark with a purple tail. onDark = white wordmark with a teal-soft tail, for slate chrome. */
  tone?: 'onLight' | 'onDark';
  /** sm = 24px tile for dense chrome. md = 30px, the sidebar and page default. lg = 40px for auth and marketing headers. */
  size?: 'sm' | 'md' | 'lg';
  /** Tile only, no wordmark. Use where the name is already on screen, or below 24px. */
  markOnly?: boolean;
  /** First half of the wordmark, carried in the primary text colour. */
  lead?: React.ReactNode;
  /** Second half, carried in purple on light and teal-soft on dark. */
  tail?: React.ReactNode;
  /** Renders an anchor instead of a span. */
  href?: string;
  style?: React.CSSProperties;
}

export declare function Logo(props: LogoProps): JSX.Element;
