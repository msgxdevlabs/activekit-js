import type * as React from 'react';

/** Top nav that floats over the gradient wash. Wordmark left, links centre, sign-in and one filled pill right. */
export interface NavBarProps {
  /** Pass "ActiveKit" (default) to get the two-tone wordmark, or any node for a custom mark. */
  brand?: React.ReactNode;
  /** Link labels, or objects with label and href. */
  items?: Array<string | { label: string; href?: string }>;
  /** Label of the item to render in full ink. */
  activeItem?: string;
  signInLabel?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  onSignIn?: (e: React.MouseEvent) => void;
  onCta?: (e: React.MouseEvent) => void;
  /** Slate surface variant for the app shell. */
  onDark?: boolean;
  /** Transparent over the wash (default) or solid canvas once scrolled. */
  transparent?: boolean;
  style?: React.CSSProperties;
}

export declare function NavBar(props: NavBarProps): JSX.Element;
