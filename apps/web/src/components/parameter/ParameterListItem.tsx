import { useState } from 'react';
import type { ParameterDeclaration, ParameterType } from '@osce/shared';
import { Trash2, Variable } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { EnumSelect } from '../property/EnumSelect';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';

const PARAMETER_TYPES: readonly ParameterType[] = [
  'string', 'double', 'int', 'boolean', 'dateTime', 'unsignedInt', 'unsignedShort',
];

interface ParameterListItemProps {
  parameter: ParameterDeclaration;
  onDelete: () => void;
}

export function ParameterListItem({ parameter, onDelete }: ParameterListItemProps) {
  const storeApi = useScenarioStoreApi();
  const [editingName, setEditingName] = useState(false);
  const [editingValue, setEditingValue] = useState(false);
  const [tempName, setTempName] = useState(parameter.name);
  const [tempValue, setTempValue] = useState(parameter.value);

  const commitName = () => {
    const trimmed = tempName.trim();
    if (trimmed && trimmed !== parameter.name) {
      storeApi.getState().renameParameter(parameter.id, trimmed);
    }
    setEditingName(false);
  };

  const commitValue = () => {
    if (tempValue !== parameter.value) {
      storeApi.getState().updateParameter(parameter.id, { value: tempValue });
    }
    setEditingValue(false);
  };

  const handleTypeChange = (newType: string) => {
    storeApi.getState().updateParameter(parameter.id, { parameterType: newType as ParameterType });
  };

  return (
    <div className="glass-item flex items-center gap-3 mx-3 my-1 px-3 py-3 group">
      <Variable className="h-4 w-4 shrink-0 text-muted-foreground" />
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
            onClick={() => { setTempName(parameter.name); setEditingName(true); }}
          >
            {parameter.name}
          </p>
        )}

        {/* Type + Value row */}
        <div className="flex items-center gap-1 mt-px">
          <EnumSelect
            value={parameter.parameterType}
            options={PARAMETER_TYPES}
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
              onClick={() => { setTempValue(parameter.value); setEditingValue(true); }}
            >
              {parameter.value || '""'}
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
