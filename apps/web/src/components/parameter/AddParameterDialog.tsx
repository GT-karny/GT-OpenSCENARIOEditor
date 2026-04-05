import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import type { ParameterType } from '@osce/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ParameterAwareInput } from '../property/ParameterAwareInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';

const PARAMETER_TYPES: ParameterType[] = [
  'string', 'double', 'int', 'boolean', 'dateTime', 'unsignedInt', 'unsignedShort',
];

interface AddParameterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddParameterDialog({ open, onOpenChange }: AddParameterDialogProps) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();
  const [name, setName] = useState('');
  const [paramType, setParamType] = useState<ParameterType>('double');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    storeApi.getState().addParameter({
      name: name.trim(),
      parameterType: paramType,
      value,
    });
    setName('');
    setParamType('double');
    setValue('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('labels.addParameter')}</DialogTitle>
          <DialogDescription>Add a global parameter declaration to the scenario.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="param-name">{t('labels.name')}</Label>
            <Input
              id="param-name"
              aria-required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., EgoSpeed"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="param-type">{t('labels.parameterType')}</Label>
            <Select value={paramType} onValueChange={(v) => setParamType(v as ParameterType)}>
              <SelectTrigger id="param-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARAMETER_TYPES.map((pt) => (
                  <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="param-value">{t('labels.defaultValue')}</Label>
            <ParameterAwareInput
              id="param-value"
              value={value}
              onValueChange={(v) => setValue(v)}
              acceptedTypes={['string', 'double', 'int', 'boolean', 'dateTime', 'unsignedInt', 'unsignedShort']}
              placeholder="Default value"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            {t('buttons.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
