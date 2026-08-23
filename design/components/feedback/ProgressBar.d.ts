import type * as React from 'react';

/** Progress track with the teal to blue gradient fill. Determinate, or indeterminate when `value` is omitted. */
export interface ProgressBarProps {
  /** 0 to 100. Omit (or pass null) for the indeterminate sweep. */
  value?: number | null;
  label?: React.ReactNode;
  /** micro-size line under the track, for counts like "1,840 of 4,000 enrolled". */
  hint?: React.ReactNode;
  /** Shows the percentage on the right of the label row, in tabular figures. */
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
}

export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
