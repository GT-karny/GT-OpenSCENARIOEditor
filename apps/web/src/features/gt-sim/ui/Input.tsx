/**
 * GT_Sim UI primitive — form inputs.
 *
 * Ported from the GT_Sim fork's `components/ui/Input.tsx` (one file, six
 * exports — kept as a single file to match the fork's import sites).
 * Restyled with APEX `var(--color-*)` tokens.
 */
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, JSX } from 'react';
import { cn } from '@/lib/utils';

const baseInput =
  'w-full rounded-none bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-glass-edge-active)] transition-colors placeholder:text-[var(--color-text-tertiary)]';

interface FieldWrapperProps {
  label?: string;
  children: ReactNode;
  className?: string;
}

function FieldWrapper({ label, children, className }: FieldWrapperProps) {
  return (
    <div className={className}>
      {label && <label className="block text-xs text-[var(--color-text-secondary)] mb-1">{label}</label>}
      {children}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapperClassName?: string;
}

export function TextInput({ label, wrapperClassName, className, ...rest }: TextInputProps) {
  return (
    <FieldWrapper label={label} className={wrapperClassName}>
      <input className={cn(baseInput, className)} {...rest} />
    </FieldWrapper>
  );
}

export interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  wrapperClassName?: string;
}

export function NumberInput({ label, wrapperClassName, className, ...rest }: NumberInputProps) {
  return (
    <FieldWrapper label={label} className={wrapperClassName}>
      <input type="number" className={cn(baseInput, className)} {...rest} />
    </FieldWrapper>
  );
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export function SelectInput({ label, wrapperClassName, className, children, ...rest }: SelectInputProps) {
  return (
    <FieldWrapper label={label} className={wrapperClassName}>
      <select className={cn(baseInput, className)} {...rest}>
        {children}
      </select>
    </FieldWrapper>
  );
}

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Checkbox({ label, description, className, ...rest }: CheckboxProps) {
  return (
    <label className={cn('flex items-center gap-2 text-sm cursor-pointer', className)}>
      <input type="checkbox" {...rest} />
      <span>{label}</span>
      {description && <span className="text-xs text-[var(--color-text-tertiary)]">{description}</span>}
    </label>
  );
}

export interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
}

export function ToggleSwitch({ label, checked, onChange, description, className }: ToggleSwitchProps) {
  return (
    <label className={cn('flex items-center justify-between gap-3 text-sm cursor-pointer select-none', className)}>
      <div className="flex items-center gap-1.5">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        {description && <span className="text-xs text-[var(--color-text-tertiary)]">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer',
          checked ? 'bg-[var(--color-accent-vivid)]' : 'bg-[var(--color-glass-1)] border border-[var(--color-glass-edge)]',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-[var(--color-text-primary)] shadow-sm transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </label>
  );
}

export interface IconToggleProps {
  icon: JSX.Element;
  label: string;
  active: boolean;
  onChange: (active: boolean) => void;
  className?: string;
}

export function IconToggle({ icon, label, active, onChange, className }: IconToggleProps) {
  return (
    <button
      type="button"
      title={label}
      onClick={() => onChange(!active)}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 h-8 rounded-none text-xs font-medium transition-all cursor-pointer select-none',
        active
          ? 'bg-[var(--color-accent-vivid)]/80 text-[var(--color-bg-void)] glow-edge'
          : 'bg-[var(--color-glass-1)] text-[var(--color-text-tertiary)] border border-[var(--color-glass-edge)] hover:bg-[var(--color-glass-hover)] hover:text-[var(--color-text-secondary)]',
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
