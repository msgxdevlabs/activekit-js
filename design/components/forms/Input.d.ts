import type * as React from 'react';

/** ActiveKit text field: 6px radius, 8px 12px padding, teal border on focus. */
export interface InputProps {
  label?: React.ReactNode;
  /** Caption-size helper under the field. */
  hint?: React.ReactNode;
  /** Replaces the hint and turns the border ruby. The message itself stays readable, at --text-body. */
  error?: React.ReactNode;
  id?: string;
  type?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  /** Force the focused skin for specimens. */
  focused?: boolean;
  /** Renders the value with body-tabular plus tnum and zero, for credits and counts. */
  numeric?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

export declare function Input(props: InputProps): JSX.Element;
