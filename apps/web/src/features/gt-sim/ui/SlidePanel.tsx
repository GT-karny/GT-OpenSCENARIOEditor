/**
 * GT_Sim UI primitive — SlidePanel (right-side drawer).
 *
 * Ported from the GT_Sim fork's `components/ui/SlidePanel.tsx`. The editor
 * has no existing `Sheet` component, so this is built directly on
 * `@radix-ui/react-dialog` (the same primitive shadcn's own `Sheet` wraps),
 * using `forceMount` + `data-[state]` transition classes so the fork's slide
 * animation on both open AND close is preserved (Radix unmounts on close by
 * default, which would otherwise skip the exit transition). Props are
 * unchanged from the fork.
 */
import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslation } from '@osce/i18n';

export interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function SlidePanel({ open, onClose, title, children }: SlidePanelProps) {
  const { t } = useTranslation('common');

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay
          forceMount
          className="fixed inset-0 z-40 bg-[var(--color-bg-void)]/50 transition-opacity duration-200 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        />
        <DialogPrimitive.Content
          forceMount
          className="glass fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-[var(--color-glass-edge)] transition-transform duration-200 ease-out data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-glass-edge)] px-5 py-4">
            <DialogPrimitive.Title className="font-display text-lg font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="cursor-pointer p-1 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              aria-label={t('gtSim.ui.slidePanel.close')}
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
