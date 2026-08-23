import type * as React from 'react';

/** Product page header: micro-cap eyebrow, display-md title, right-hand actions, optional tab row. */
export interface AppTopBarProps {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  /** Right-hand controls. Keep at most one filled teal pill. */
  children?: React.ReactNode;
  /** Tab row rendered under the title; the header drops its bottom padding to make room. */
  below?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function AppTopBar(props: AppTopBarProps): JSX.Element;
