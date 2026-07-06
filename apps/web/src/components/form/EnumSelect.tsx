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
  /** Options to disable, each mapped to a tooltip (title) explaining why. */
  disabledOptions?: Readonly<Record<string, string>>;
}

const EMPTY_SENTINEL = '__empty__';

export function EnumSelect({
  value,
  options,
  onValueChange,
  className,
  disabledOptions,
}: EnumSelectProps) {
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
          const disabledTitle = disabledOptions?.[option];
          return (
            <SelectItem
              key={itemValue}
              value={itemValue}
              disabled={disabledTitle !== undefined}
              title={disabledTitle}
            >
              {option || '(none)'}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
