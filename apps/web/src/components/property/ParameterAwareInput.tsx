import { useState, useRef, useCallback, forwardRef } from 'react';
import { Input } from '../ui/input';
import { useScenarioStore } from '../../stores/use-scenario-store';
import { cn } from '@/lib/utils';

interface ParameterAwareInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onValueChange: (value: string) => void;
  value: string;
}

/**
 * Drop-in replacement for Input that shows parameter name suggestions
 * when the user types `$`. Use for text fields that may accept parameter references.
 */
export const ParameterAwareInput = forwardRef<HTMLInputElement, ParameterAwareInputProps>(
  function ParameterAwareInput({ onValueChange, value, className, ...props }, _ref) {
    const parameters = useScenarioStore((s) => s.document.parameterDeclarations);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filter, setFilter] = useState('');
    const [dollarIndex, setDollarIndex] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = parameters.filter((p) =>
      p.name.toLowerCase().startsWith(filter.toLowerCase()),
    );

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const pos = e.target.selectionStart ?? val.length;
      onValueChange(val);

      // Find the $ token being typed at the cursor position
      const beforeCursor = val.substring(0, pos);
      const dIdx = beforeCursor.lastIndexOf('$');
      if (dIdx !== -1) {
        // Only trigger if $ is at start or preceded by whitespace/expression chars
        const charBefore = dIdx > 0 ? beforeCursor[dIdx - 1] : ' ';
        if (charBefore === ' ' || charBefore === '{' || dIdx === 0) {
          const fragment = beforeCursor.substring(dIdx + 1);
          // Only show if fragment doesn't contain spaces (i.e., still typing the param name)
          if (!fragment.includes(' ')) {
            setFilter(fragment);
            setDollarIndex(dIdx);
            setShowSuggestions(true);
            setSelectedIndex(0);
            return;
          }
        }
      }
      setShowSuggestions(false);
    }, [onValueChange]);

    const handleSelect = useCallback((paramName: string) => {
      const replacement = `$${paramName}`;
      const currentVal = String(value);
      // Replace from dollarIndex to the end of the current token
      const afterDollar = currentVal.substring(dollarIndex + 1);
      const nextSpace = afterDollar.search(/[\s}]/);
      const endPos = dollarIndex + 1 + (nextSpace === -1 ? afterDollar.length : nextSpace);
      const newVal = currentVal.substring(0, dollarIndex) + replacement + currentVal.substring(endPos);
      onValueChange(newVal);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }, [value, dollarIndex, onValueChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || filtered.length === 0) {
        props.onKeyDown?.(e);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelect(filtered[selectedIndex].name);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      } else {
        props.onKeyDown?.(e);
      }
    }, [showSuggestions, filtered, selectedIndex, handleSelect, props]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Delay to allow click on suggestion
      setTimeout(() => setShowSuggestions(false), 150);
      props.onBlur?.(e);
    }, [props]);

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={className}
          {...props}
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-32 overflow-auto rounded border border-[var(--color-border-glass)] bg-[var(--color-bg-deep)] shadow-md">
            {filtered.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                  i === selectedIndex && 'bg-[var(--color-glass-1)]',
                )}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(p.name); }}
              >
                <span className="font-medium text-[var(--color-accent-1)]">${p.name}</span>
                <span className="text-[var(--color-text-tertiary)] text-[10px]">{p.parameterType}</span>
                <span className="text-[var(--color-text-tertiary)] text-[10px] ml-auto">= {p.value}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
