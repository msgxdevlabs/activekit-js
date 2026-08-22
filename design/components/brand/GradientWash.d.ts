import type * as React from 'react';

/** The brand's signature backdrop: six blurred orbs washed across the upper third of a page. */
export interface GradientWashProps {
  /** Page content, rendered above the wash. */
  children?: React.ReactNode;
  /** Band height, default `--wash-height` (33%). */
  height?: string;
  /** Per-orb opacity. Default 0.34. Above about 0.5 it stops being a wash. */
  opacity?: number;
  /** Blur radius, default `--wash-blur` (90px). */
  blur?: string;
  /** Base surface under the wash. */
  background?: string;
  style?: React.CSSProperties;
}

export declare function GradientWash(props: GradientWashProps): JSX.Element;
