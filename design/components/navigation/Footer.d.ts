import type * as React from 'react';

/** Site footer: wordmark and tagline, four to six link columns, and a legal row. */
export interface FooterProps {
  brand?: React.ReactNode;
  tagline?: React.ReactNode;
  columns?: Array<{ title: string; links: Array<string | { label: string; href?: string }> }>;
  legal?: React.ReactNode;
  legalLinks?: Array<string | { label: string; href?: string }>;
  style?: React.CSSProperties;
}

export declare function Footer(props: FooterProps): JSX.Element;
