import { useState, useCallback, type DragEvent } from 'react';
import type { UseCaseComponent } from '@osce/shared';
import { getUseCaseById } from '@osce/templates';
import { useTemplateApply } from './use-template-apply';

export function useTemplateDrop() {
  const [droppedUseCase, setDroppedUseCase] = useState<UseCaseComponent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { applyTemplate } = useTemplateApply();

  const handleDragOver = useCallback((e: DragEvent) => {
    if (e.dataTransfer.types.includes('application/osce-use-case-id')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const useCaseId = e.dataTransfer.getData('application/osce-use-case-id');
    if (!useCaseId) return;

    const useCase = getUseCaseById(useCaseId);
    if (!useCase) return;

    setDroppedUseCase(useCase);
    setDialogOpen(true);
  }, []);

  const handleApply = useCallback(
    (params: Record<string, unknown>) => {
      if (droppedUseCase) {
        applyTemplate(droppedUseCase, params);
      }
    },
    [droppedUseCase, applyTemplate],
  );

  const handleDialogClose = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setDroppedUseCase(null);
  }, []);

  return {
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragOver,
    droppedUseCase,
    dialogOpen,
    handleDialogClose,
    handleApply,
  };
}
