import type * as React from 'react';

/**
 * ActiveKit pill button. `primary` is the everyday CTA on a teal gradient ramp;
 * `brand` is the bold teal → blue → purple ramp, one per view.
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** primary = teal gradient CTA; brand = full brand ramp, hero only; secondary = white-to-tint with a teal border; onDark = slate gradient for dark chrome; ghost = borderless, for toolbars and dense product UI. */
  variant?: 'primary' | 'brand' | 'secondary' | 'onDark' | 'ghost';
  /** md = button-md 16px / 8px 16px padding. sm = button-sm 14px / 8px 12px padding. */
  size?: 'md' | 'sm';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  /** Force the pressed skin (`--cta-fill-press`) for specimens and toggle-like controls. */
  pressed?: boolean;
  /** Swaps the left icon for a spinner, blocks input, and sets aria-busy. */
  loading?: boolean;
  /** Label shown while loading, for example "Launching". Falls back to `children`. */
  loadingLabel?: React.ReactNode;
  fullWidth?: boolean;
  /** Renders an anchor instead of a button. */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;
