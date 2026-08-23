import type * as React from 'react';

export type IconName =
  | 'overview' | 'campaigns' | 'ledger' | 'credits' | 'developers' | 'settings' | 'team' | 'chart'
  | 'search' | 'filter' | 'plus' | 'check' | 'close' | 'alert' | 'bell' | 'inbox' | 'user'
  | 'doc' | 'folder' | 'clock' | 'refresh' | 'download' | 'external' | 'trash' | 'play' | 'menu'
  | 'chevronRight' | 'chevronDown' | 'chevronUpDown' | 'arrowRight';

/** Geometric line icon on a 24 grid. Draws in `currentColor`, so colour it by setting text colour. */
export interface IconProps {
  name: IconName;
  /** sm 16, md 20, lg 24, xl 28, or any px number. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  strokeWidth?: number;
  color?: string;
  /** Give an icon a title only when it carries meaning on its own; decorative icons stay unlabelled. */
  title?: string;
  style?: React.CSSProperties;
}

export declare function Icon(props: IconProps): JSX.Element;
/** Every glyph key, for specimens and pickers. */
export declare const iconNames: IconName[];
