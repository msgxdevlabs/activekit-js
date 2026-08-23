import type * as React from 'react';

/** Subdued teal tag at micro-cap size. Status labels, eyebrows, and table chips. */
export interface PillProps {
  children?: React.ReactNode;
  /** soft = pale teal fill (the spec default) · outline = white with hairline · onDark = translucent white on slate. */
  tone?: 'soft' | 'outline' | 'onDark';
  /** Leading 4px teal dot, the brand's stand-in for a status glyph. */
  dot?: boolean;
  style?: React.CSSProperties;
}

export declare function Pill(props: PillProps): JSX.Element;
