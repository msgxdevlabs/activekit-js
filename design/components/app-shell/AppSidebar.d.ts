import type * as React from 'react';
import type { IconName } from '../icons/Icon';

/** Slate sidebar for the product shell: gradient logo tile, workspace switcher, icon nav, an optional credit meter, and a user row. */
export interface AppSidebarProps {
  /** Pass "ActiveKit" (default) for the two-tone wordmark, or any node. The gradient logo tile is always drawn. */
  brand?: React.ReactNode;
  /** Workspace switcher above the nav. Omit for a single-workspace product. */
  workspace?: { initials: string; name: React.ReactNode; plan?: React.ReactNode };
  /** Nav entries. `{ section }` renders a micro-cap group label. Icons are inferred from the label, or set `icon` to override. Mark one `active`. */
  items?: Array<string | { label: string; href?: string; active?: boolean; icon?: IconName; badge?: React.ReactNode } | { section: React.ReactNode }>;
  /** Credit meter pinned to the bottom. `pct` draws the gradient fill bar; omit it for a plain stat. */
  meter?: { label: React.ReactNode; value?: React.ReactNode; note?: React.ReactNode; pct?: number };
  /** User row at the foot of the column. `role` is the second line and is optional: a surface with no second fact to show omits it and the line is not drawn. */
  user?: { initials: string; name: React.ReactNode; role?: React.ReactNode };
  /** Trailing glyph on the user row. Defaults to a settings icon; pass null to drop it. */
  footerAction?: React.ReactNode | null;
  width?: string;
  style?: React.CSSProperties;
}

export declare function AppSidebar(props: AppSidebarProps): JSX.Element;
