import { useState, useRef, useCallback, useEffect, useMemo, forwardRef } from 'react';
import { Input } from '../ui/input';
import { useScenarioStore, useScenarioStoreApi } from '../../stores/use-scenario-store';
import { PARAMETER_DND_TYPE } from '../parameter/ParameterListItem';
import { VARIABLE_DND_TYPE } from '../variable/VariableListItem';
import { cn } from '@/lib/utils';
import { isExpression, looksLikeExpression, evaluateExpression } from '@/lib/expression-utils';

interface ParameterAwareInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  onValueChange: (value: string) => void;
  value: string | number;
  /** Filter suggestions to parameters matching these types (e.g., ['double','int']) */
  acceptedTypes?: string[];
  /** Element ID for parameter binding support (required for numeric fields) */
  elementId?: string;
  /** Field path for parameter binding lookup (required for numeric fields) */
  fieldName?: string;
}

/**
 * Drop-in replacement for Input that shows parameter name suggestions
 * when the user types `$`. Supports both text and numeric fields.
 *
 * For text fields: value can contain `$ParamName` directly.
 * For numeric fields: provide `elementId` + `fieldName` to use the parameter bindings map.
 * Also supports OpenSCENARIO v1.3.1 expressions: `${250/3.6}`, `${$speed * 0.5}`.
 */
export const ParameterAwareInput = forwardRef<HTMLInputElement, ParameterAwareInputProps>(
  function ParameterAwareInput({
    onValueChange, value, className, acceptedTypes, elementId, fieldName, ...props
  }, _ref) {
    const parameters = useScenarioStore((s) => s.document.parameterDeclarations);
    const variables = useScenarioStore((s) => s.document.variableDeclarations);
    const binding = useScenarioStore((s) =>
      elementId && fieldName
        ? s.document._editor.parameterBindings[elementId]?.[fieldName] ?? null
        : null,
    );
    const storeApi = useScenarioStoreApi();

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filter, setFilter] = useState('');
    const [dollarIndex, setDollarIndex] = useState(-1);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const [localEditValue, setLocalEditValue] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref to always have the latest localEditValue (avoids stale closure in blur/keydown)
    const localEditValueRef = useRef<string | null>(null);
    localEditValueRef.current = localEditValue;

    // Merge parameters and variables into a unified suggestion list
    const filtered: { name: string; type: string; value: string; kind: 'param' | 'var' }[] = [];
    const lowerFilter = filter.toLowerCase();
    for (const p of parameters) {
      if (acceptedTypes && !acceptedTypes.includes(p.parameterType)) continue;
      if (p.name.toLowerCase().startsWith(lowerFilter)) {
        filtered.push({ name: p.name, type: p.parameterType, value: p.value, kind: 'param' });
      }
    }
    for (const v of variables) {
      if (acceptedTypes && !acceptedTypes.includes(v.variableType)) continue;
      if (v.name.toLowerCase().startsWith(lowerFilter)) {
        filtered.push({ name: v.name, type: v.variableType, value: v.value, kind: 'var' });
      }
    }

    // Determine display value: binding overrides the actual value for numeric fields
    // Strip ${} wrapper for display — users see raw expressions (e.g. "250/3.6" not "${250/3.6}")
    const displayBinding = binding && isExpression(binding) ? binding.slice(2, -1) : binding;
    const displayValue = localEditValue ?? displayBinding ?? String(value);
    const isBound = binding !== null;
    const isExpr = binding ? isExpression(binding) : false;
    const isParamRef = isBound && !isExpr;

    // Resolve the parameter/variable's current value for the badge shown on bound fields
    const activeRef = binding ?? localEditValue;
    const resolvedParam = activeRef && !isExpression(activeRef)
      ? parameters.find((p) => `$${p.name}` === activeRef)
        ?? variables.find((v) => `$${v.name}` === activeRef)
      : null;

    // Evaluate expression to show computed result
    const evaluatedResult = useMemo(() => {
      if (!isExpr || !binding) return undefined;
      return evaluateExpression(binding, parameters, variables);
    }, [isExpr, binding, parameters, variables]);

    /** Save an expression or $param to parameterBindings. Auto-wraps arithmetic in ${}. */
    const confirmExpression = useCallback((expr: string) => {
      if (!elementId || !fieldName) return false;
      // Already wrapped: ${...}
      if (isExpression(expr)) {
        storeApi.getState().setParameterBinding(elementId, fieldName, expr);
        return true;
      }
      // Contains arithmetic operators → auto-wrap in ${...}
      if (looksLikeExpression(expr)) {
        storeApi.getState().setParameterBinding(elementId, fieldName, `\${${expr.trim()}}`);
        return true;
      }
      // $ParamName → save as parameter reference
      if (expr.startsWith('$')) {
        storeApi.getState().setParameterBinding(elementId, fieldName, expr);
        return true;
      }
      return false;
    }, [elementId, fieldName, storeApi]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const pos = e.target.selectionStart ?? val.length;

      // If this field had a binding and user is typing a non-$ value, clear binding
      if (isBound && elementId && fieldName && !val.startsWith('$')) {
        storeApi.getState().removeParameterBinding(elementId, fieldName);
      }

      // For numeric fields: hold $-prefixed values and arithmetic expressions
      // in local state (parent would parseFloat them to NaN/0)
      if (elementId && fieldName && (val.startsWith('$') || looksLikeExpression(val))) {
        setLocalEditValue(val);
      } else {
        setLocalEditValue(null);
        onValueChange(val);
      }

      // Find the $ token being typed at the cursor position
      const beforeCursor = val.substring(0, pos);
      const dIdx = beforeCursor.lastIndexOf('$');
      if (dIdx !== -1) {
        // Only trigger if $ is at start or preceded by whitespace/operator/expression chars
        const charBefore = dIdx > 0 ? beforeCursor[dIdx - 1] : ' ';
        if (dIdx === 0 || /[\s{+\-*/%,(]/.test(charBefore)) {
          const fragment = beforeCursor.substring(dIdx + 1);
          // Only show if fragment looks like a parameter name (no operators/spaces)
          if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(fragment) || fragment === '') {
            setFilter(fragment);
            setDollarIndex(dIdx);
            setShowSuggestions(true);
            setSelectedIndex(0);
            return;
          }
        }
      }
      setShowSuggestions(false);
    }, [onValueChange, isBound, elementId, fieldName, storeApi]);

    const handleSelect = useCallback((paramName: string) => {
      const replacement = `$${paramName}`;

      if (elementId && fieldName && localEditValue && (localEditValue.startsWith('${') || looksLikeExpression(localEditValue))) {
        // Inside expression: insert param ref at $ position within the expression
        const afterDollar = localEditValue.substring(dollarIndex + 1);
        const nextDelim = afterDollar.search(/[\s}+\-*/%(),]/);
        const endPos = dollarIndex + 1 + (nextDelim === -1 ? afterDollar.length : nextDelim);
        const newVal = localEditValue.substring(0, dollarIndex) + replacement + localEditValue.substring(endPos);
        setLocalEditValue(newVal);
      } else if (elementId && fieldName) {
        // Numeric field: set binding instead of changing the value
        storeApi.getState().setParameterBinding(elementId, fieldName, replacement);
        setLocalEditValue(null);
      } else {
        // Text field: insert $ParamName into the text value
        const currentVal = String(value);
        const afterDollar = currentVal.substring(dollarIndex + 1);
        const nextSpace = afterDollar.search(/[\s}]/);
        const endPos = dollarIndex + 1 + (nextSpace === -1 ? afterDollar.length : nextSpace);
        const newVal = currentVal.substring(0, dollarIndex) + replacement + currentVal.substring(endPos);
        onValueChange(newVal);
      }

      setShowSuggestions(false);
      inputRef.current?.focus();
    }, [value, dollarIndex, localEditValue, onValueChange, elementId, fieldName, storeApi]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Confirm expression on Enter — but only when no suggestion is available to select
      const hasSuggestions = showSuggestions && filtered.length > 0;
      if (e.key === 'Enter' && !hasSuggestions && localEditValueRef.current && elementId && fieldName) {
        if (confirmExpression(localEditValueRef.current)) {
          setLocalEditValue(null);
          setShowSuggestions(false);
          e.preventDefault();
          return;
        }
      }

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
    }, [showSuggestions, filtered, selectedIndex, handleSelect, confirmExpression, elementId, fieldName, props]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (elementId && fieldName) {
        e.target.select();
      }
      props.onFocus?.(e);
    }, [elementId, fieldName, props]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Delay to allow click on suggestion
      blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 150);
      // Confirm complete expression on blur (use ref for latest value)
      const editVal = localEditValueRef.current;
      if (editVal) {
        confirmExpression(editVal);
      }
      setLocalEditValue(null);
      props.onBlur?.(e);
    }, [confirmExpression, props]);

    // Cleanup blur timer on unmount
    useEffect(() => {
      return () => {
        if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      };
    }, []);

    const handleDropDragOver = useCallback((e: React.DragEvent) => {
      if (e.dataTransfer.types.includes(PARAMETER_DND_TYPE) || e.dataTransfer.types.includes(VARIABLE_DND_TYPE)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }
    }, []);

    const handleDropDragLeave = useCallback(() => {
      setIsDragOver(false);
    }, []);

    const handleDropParam = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const paramName = e.dataTransfer.getData(PARAMETER_DND_TYPE) || e.dataTransfer.getData(VARIABLE_DND_TYPE);
        if (!paramName) return;

        const replacement = `$${paramName}`;
        if (elementId && fieldName) {
          // Numeric field: set binding
          storeApi.getState().setParameterBinding(elementId, fieldName, replacement);
          setLocalEditValue(null);
        } else {
          // Text field: replace entire value
          onValueChange(replacement);
        }
      },
      [elementId, fieldName, storeApi, onValueChange],
    );

    return (
      <div
        className="relative"
        onDragOver={handleDropDragOver}
        onDragLeave={handleDropDragLeave}
        onDrop={handleDropParam}
      >
        <Input
          {...props}
          ref={inputRef}
          type="text"
          inputMode={elementId && fieldName ? 'text' : undefined}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            className,
            resolvedParam && 'pr-16',
            isExpr && 'pr-16 text-[var(--color-accent-2)] font-mono text-[11px]',
            isParamRef && 'text-[var(--color-accent-1)] font-medium',
            isDragOver && 'ring-2 ring-[var(--color-accent-1)] border-[var(--color-accent-1)]',
          )}
        />
        {isExpr && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[var(--color-accent-2)] opacity-70 pointer-events-none select-none tabular-nums">
            {evaluatedResult !== undefined
              ? `= ${Number.isInteger(evaluatedResult) ? evaluatedResult : evaluatedResult.toFixed(2)}`
              : 'fx'}
          </span>
        )}
        {isParamRef && resolvedParam && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-text-tertiary)] pointer-events-none select-none tabular-nums">
            = {resolvedParam.value}
          </span>
        )}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-50 top-full left-0 mt-1 w-full max-h-32 overflow-auto rounded border border-[var(--color-border-glass)] bg-[var(--color-bg-deep)] shadow-md">
            {filtered.map((item, i) => (
              <button
                key={`${item.kind}-${item.name}`}
                type="button"
                className={cn(
                  'w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-[var(--color-glass-1)]',
                  i === selectedIndex && 'bg-[var(--color-glass-1)]',
                )}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item.name); }}
              >
                <span className="font-medium text-[var(--color-accent-1)]">${item.name}</span>
                <span className="text-[var(--color-text-tertiary)] text-[10px]">{item.kind === 'var' ? 'var' : 'param'}</span>
                <span className="text-[var(--color-text-tertiary)] text-[10px]">{item.type}</span>
                <span className="text-[var(--color-text-tertiary)] text-[10px] ml-auto">= {item.value}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
