import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Label } from '../ui/label';

interface OptionalFieldWrapperProps {
  label: string;
  hasValue: boolean;
  onClear: () => void;
  children: React.ReactNode;
}

export function OptionalFieldWrapper({
  label,
  hasValue,
  onClear,
  children,
}: OptionalFieldWrapperProps) {
  const [expanded, setExpanded] = useState(hasValue);

  useEffect(() => {
    if (hasValue) setExpanded(true);
  }, [hasValue]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground
                   border border-dashed border-[var(--color-glass-edge)] rounded-sm
                   hover:border-[var(--color-glass-edge-mid)] hover:text-foreground
                   transition-colors cursor-pointer"
      >
        <Plus className="h-3 w-3" />
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <button
          type="button"
          onClick={() => {
            onClear();
            setExpanded(false);
          }}
          className="text-muted-foreground hover:text-destructive p-0.5 transition-colors cursor-pointer"
          title="Clear"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {children}
    </div>
  );
}
