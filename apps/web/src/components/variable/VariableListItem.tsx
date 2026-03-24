import { useState, useCallback } from 'react';
import type { VariableDeclaration, ParameterType } from '@osce/shared';
import { GripVertical, Trash2, ToggleLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EnumSelect } from '../property/EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';
import { cn } from '@/lib/utils';

const VARIABLE_TYPES: readonly ParameterType[] = [
  'string', 'double', 'int', 'boolean', 'dateTime', 'unsignedInt', 'unsignedShort',
];

interface VariableListItemProps {
  variable: VariableDeclaration;
  onDelete: () => void;
}

export const VARIABLE_DND_TYPE = 'application/osce-variable-ref';

export function VariableListItem({ variable, onDelete }: VariableListItemProps) {
  const storeApi = useScenarioStoreApi();
  const [editingName, setEditingName] = useState(false);
  const [editingValue, setEditingValue] = useState(false);
  const [tempName, setTempName] = useState(variable.name);
  const [tempValue, setTempValue] = useState(variable.value);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(VARIABLE_DND_TYPE, variable.name);
      e.dataTransfer.effectAllowed = 'copy';
      setIsDragging(true);
    },
    [variable.name],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const commitName = () => {
    const trimmed = tempName.trim();
    if (trimmed && trimmed !== variable.name) {
      storeApi.getState().renameVariable(variable.id, trimmed);
    }
    setEditingName(false);
  };

  const commitValue = () => {
    if (tempValue !== variable.value) {
      storeApi.getState().updateVariable(variable.id, { value: tempValue });
    }
    setEditingValue(false);
  };

  const handleTypeChange = (newType: string) => {
    storeApi.getState().updateVariable(variable.id, { variableType: newType as ParameterType });
  };

  return (
    <div
      className={cn(
        'glass-item flex items-center gap-3 mx-3 my-1 px-3 py-3 group',
        isDragging && 'opacity-50',
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-grab" />
      <ToggleLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        {/* Name */}
        {editingName ? (
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            className="h-5 text-[12px] px-1"
            autoFocus
          />
        ) : (
          <p
            className="text-[12px] font-medium truncate cursor-text hover:text-[var(--color-accent-1)]"
            onClick={() => { setTempName(variable.name); setEditingName(true); }}
          >
            {variable.name}
          </p>
        )}

        {/* Type + Value row */}
        <div className="flex items-center gap-1 mt-px">
          <EnumSelect
            value={variable.variableType}
            options={VARIABLE_TYPES}
            onValueChange={handleTypeChange}
            className="h-5 text-[10px] w-20 px-1"
          />
          <span className="text-[10px] text-[var(--color-text-tertiary)]">=</span>
          {editingValue ? (
            <Input
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={commitValue}
              onKeyDown={(e) => { if (e.key === 'Enter') commitValue(); if (e.key === 'Escape') setEditingValue(false); }}
              className="h-5 text-[10px] flex-1 min-w-0 px-1"
              autoFocus
            />
          ) : (
            <span
              className="text-[10px] text-[var(--color-accent-1)] cursor-text hover:underline truncate"
              onClick={() => { setTempValue(variable.value); setEditingValue(true); }}
            >
              {variable.value || '""'}
            </span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
