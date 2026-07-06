import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface EnumSelectProps {
  value: string;
  options: readonly string[];
  onValueChange: (value: string) => void;
  className?: string;
}

const EMPTY_SENTINEL = '__empty__';

export function EnumSelect({ value, options, onValueChange, className }: EnumSelectProps) {
  const hasEmpty = options.includes('');

  const handleChange = (v: string) => {
    onValueChange(v === EMPTY_SENTINEL ? '' : v);
  };

  return (
    <Select value={value === '' && hasEmpty ? EMPTY_SENTINEL : value} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const itemValue = option === '' ? EMPTY_SENTINEL : option;
          return (
            <SelectItem key={itemValue} value={itemValue}>
              {option || '(none)'}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
