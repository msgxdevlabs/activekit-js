import type * as React from 'react';

/**
 * ActiveKit surface container: feature card on white, violet interlude band, or dashboard-mockup chrome.
 */
export interface CardProps {
  children?: React.ReactNode;
  /** feature = white + hairline + level 1 (32px pad) · violet = `--canvas-violet` flat (32px pad) · mockup = white + level 2 + tabular figures (24px pad). */
  variant?: 'feature' | 'violet' | 'mockup';
  /** Override the variant's shadow level. */
  elevation?: '0' | '1' | '2' | 0 | 1 | 2;
  /** Override the variant's 1px hairline border. */
  bordered?: boolean;
  /** Optional all-caps micro-cap label above the title. */
  eyebrow?: React.ReactNode;
  /** Optional display-md (26px Space Grotesk 700) card title. */
  title?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

export declare function Card(props: CardProps): JSX.Element;
