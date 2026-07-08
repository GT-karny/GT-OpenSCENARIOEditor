interface SPositionSliderProps {
  roadLength: number;
  value: number;
  onChange: (s: number) => void;
}

export function SPositionSlider({ roadLength, value, onChange }: SPositionSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-[var(--color-text-muted)] shrink-0">
        s = {value.toFixed(1)} / {roadLength.toFixed(1)} m
      </label>
      <input
        type="range"
        min={0}
        max={roadLength}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 accent-[var(--color-accent-1)]"
      />
    </div>
  );
}
