import type * as React from 'react';

/** Indeterminate ring loader. The only spinner in the system. */
export interface SpinnerProps {
  /** sm 16 (inside buttons and rows), md 20, lg 28, xl 40 (page-level), or any px number. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  tone?: 'primary' | 'brand' | 'onDark' | 'neutral';
  /** Renders a body-sm label beside the ring, for example "Loading campaigns". */
  label?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Spinner(props: SpinnerProps): JSX.Element;
