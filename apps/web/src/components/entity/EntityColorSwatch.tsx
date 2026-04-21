import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import { HexColorPicker } from 'react-colorful';
import { Shuffle, X } from 'lucide-react';
import {
  VEHICLE_COLOR_PRESETS,
  isValidHex,
  normalizeHex,
  pickRandomPresetColor,
} from '@osce/shared';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface EntityColorSwatchProps {
  color: string | undefined;
  onChange: (hex: string | undefined) => void;
  size?: 'sm' | 'md';
  title?: string;
}

export function EntityColorSwatch({ color, onChange, size = 'sm', title }: EntityColorSwatchProps) {
  const { t } = useTranslation('common');
  const [hexDraft, setHexDraft] = useState<string>(color ?? '');
  const [draftInvalid, setDraftInvalid] = useState(false);

  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-[14px] w-[14px]';
  const label = color ? `${t('entityColor.label')}: ${color}` : t('entityColor.unset');

  const handleHexInput = (value: string) => {
    setHexDraft(value);
    const trimmed = value.trim();
    if (trimmed === '') {
      setDraftInvalid(false);
      return;
    }
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (isValidHex(withHash)) {
      setDraftInvalid(false);
      onChange(normalizeHex(withHash));
    } else {
      setDraftInvalid(true);
    }
  };

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) {
          setHexDraft(color ?? '');
          setDraftInvalid(false);
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={title ?? label}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className={cn(
            sizeClass,
            'shrink-0 border border-[var(--color-glass-edge)] cursor-pointer',
            'hover:border-[var(--color-accent-vivid)] transition-colors',
          )}
          style={
            color
              ? { backgroundColor: color }
              : {
                  backgroundImage:
                    'linear-gradient(135deg, transparent 43%, var(--color-text-tertiary) 43%, var(--color-text-tertiary) 57%, transparent 57%)',
                  backgroundColor: 'var(--color-glass-1)',
                }
          }
        />
      </PopoverTrigger>
      <PopoverContent
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className="w-64"
      >
        <div className="flex flex-col gap-3">
          <HexColorPicker
            color={color ?? '#888888'}
            onChange={(c) => onChange(normalizeHex(c))}
            style={{ width: '100%', height: 140 }}
          />

          <div>
            <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1 uppercase tracking-wide">
              {t('entityColor.presets')}
            </div>
            <div className="grid grid-cols-6 gap-1">
              {VEHICLE_COLOR_PRESETS.map((p) => {
                const selected = color?.toUpperCase() === p.hex.toUpperCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    title={`${p.name} ${p.hex}`}
                    onClick={() => onChange(p.hex)}
                    className={cn(
                      'h-5 w-full border',
                      selected
                        ? 'border-[var(--color-accent-vivid)] ring-1 ring-[var(--color-accent-vivid)]'
                        : 'border-[var(--color-glass-edge)] hover:border-[var(--color-accent-vivid)]',
                    )}
                    style={{ backgroundColor: p.hex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase w-8">
              {t('entityColor.hex')}
            </span>
            <Input
              value={hexDraft}
              onChange={(e) => handleHexInput(e.target.value)}
              placeholder="#RRGGBB"
              className={cn('h-7 text-[11px] font-mono', draftInvalid && 'border-[var(--color-warning)]')}
            />
          </div>
          {draftInvalid && (
            <div className="text-[10px] text-[var(--color-warning)]">{t('entityColor.invalidHex')}</div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1"
              onClick={() => onChange(pickRandomPresetColor(color))}
            >
              <Shuffle className="h-3 w-3" />
              {t('entityColor.random')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] gap-1"
              onClick={() => onChange(undefined)}
              disabled={!color}
            >
              <X className="h-3 w-3" />
              {t('entityColor.clear')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
