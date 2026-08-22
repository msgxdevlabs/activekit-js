import type * as React from 'react';
import type { IconName } from '../icons/Icon';

/** Dialog shell for modals, confirms, and prompts. Scrim, panel, gradient top rule, action footer. */
export interface ModalProps {
  open?: boolean;
  title?: React.ReactNode;
  /** One or two sentences under the title. The question, or what is about to happen. */
  description?: React.ReactNode;
  /** Body content: a form field for a prompt, a summary list for a confirm. Keep it short. */
  children?: React.ReactNode;
  /** Icon name or node. Omit on plain prompts; use it when the dialog carries consequence. */
  icon?: IconName | React.ReactNode;
  /** brand for ordinary dialogs, danger for destructive confirms, success for completion, neutral for informational. */
  tone?: 'brand' | 'neutral' | 'danger' | 'success';
  /** sm 400 (prompt), md 520 (confirm), lg 680 (form). */
  size?: 'sm' | 'md' | 'lg';
  /** Footer buttons, right aligned. Cancel first, the committing action last. */
  actions?: React.ReactNode;
  /** micro text pinned left in the footer, for a shortcut or an irreversibility note. */
  footnote?: React.ReactNode;
  onClose?: () => void;
  /** Draws the close affordance and lets a scrim click dismiss. Turn off for a dialog that must be answered. */
  dismissible?: boolean;
  /** Renders inside its container instead of over the viewport. For specimens and embedded previews. */
  inline?: boolean;
  style?: React.CSSProperties;
}

export declare function Modal(props: ModalProps): JSX.Element | null;
