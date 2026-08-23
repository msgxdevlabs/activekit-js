import type * as React from 'react';

/**
 * Pricing tier card. `featured` inverts the surface to deep slate, the brand's featured-tier choice.
 */
export interface PricingCardProps {
  /** Tier name, rendered at heading-lg (22px Inter 600). */
  tierName: React.ReactNode;
  /** Price, rendered at display-md (26px Space Grotesk 700) with tabular figures. */
  price: React.ReactNode;
  /** e.g. "/mo" or "per 1k credits", the caption beside the price. */
  priceSuffix?: React.ReactNode;
  description?: React.ReactNode;
  /** Feature lines; each gets a teal dot and tabular figures. */
  features?: React.ReactNode[];
  ctaLabel?: React.ReactNode;
  /** Overrides the CTA skin. Defaults to `primary` on a featured card and `secondary` otherwise. Use `primary` across a tier row when every tier's CTA is its own decision, and `brand` on the one tier you are steering to. */
  ctaVariant?: 'primary' | 'brand' | 'secondary' | 'onDark' | 'ghost';
  ctaHref?: string;
  onCtaClick?: (e: React.MouseEvent) => void;
  /** Inverts to `--brand-dark-900` with white text and the filled teal CTA. */
  featured?: boolean;
  /** Micro-size line under the CTA. */
  footnote?: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function PricingCard(props: PricingCardProps): JSX.Element;
