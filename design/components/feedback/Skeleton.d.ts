import type * as React from 'react';

/** Shimmering placeholder that holds the shape of content still loading. */
export interface SkeletonProps {
  /** text 12px, title 22px, metric 34px, pill, avatar 32px circle, block 96px, chart 148px. */
  variant?: 'text' | 'title' | 'metric' | 'pill' | 'avatar' | 'block' | 'chart';
  /** Stacks n bars; the last one is short, the way a paragraph ends. */
  lines?: number;
  width?: string;
  height?: string;
  radius?: string;
  gap?: string;
  /** dark for skeletons on slate chrome. */
  tone?: 'light' | 'dark';
  /** Off gives a static placeholder, for print and dense specimen grids. */
  animated?: boolean;
  style?: React.CSSProperties;
}

export declare function Skeleton(props: SkeletonProps): JSX.Element;
