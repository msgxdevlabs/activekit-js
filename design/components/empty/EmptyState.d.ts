import type * as React from 'react';
import type { IconName } from '../icons/Icon';

/** Empty page, empty table, no search results, first run. Medallion, sentence, action. */
export interface EmptyStateProps {
  /** Icon name, any node, or null to drop the medallion entirely. */
  icon?: IconName | React.ReactNode | null;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons. One primary, at most one secondary beside it. */
  actions?: React.ReactNode;
  /** micro line under the actions, for a docs pointer or a keyboard hint. */
  hint?: React.ReactNode;
  /** sm inside cards and table bodies, md the default, lg for a whole empty page. */
  size?: 'sm' | 'md' | 'lg';
  /** light on page chrome, dark on slate chrome, danger when the region is empty because a request failed. */
  tone?: 'light' | 'dark' | 'danger';
  /** none when the parent already draws a container; dashed for an empty region; card for a standalone panel. */
  frame?: 'none' | 'dashed' | 'card';
  align?: 'center' | 'left';
  style?: React.CSSProperties;
}

export declare function EmptyState(props: EmptyStateProps): JSX.Element;
