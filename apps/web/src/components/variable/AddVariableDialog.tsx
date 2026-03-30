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

const VARIABLE_TYPES: ParameterType[] = [
  'string', 'double', 'int', 'boolean', 'dateTime', 'unsignedInt', 'unsignedShort',
];

interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddVariableDialog({ open, onOpenChange }: AddVariableDialogProps) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();
  const [name, setName] = useState('');
  const [varType, setVarType] = useState<ParameterType>('double');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    storeApi.getState().addVariable({
      name: name.trim(),
      variableType: varType,
      value,
    });
    setName('');
    setVarType('double');
    setValue('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('labels.addVariable')}</DialogTitle>
          <DialogDescription>Add a global variable declaration to the scenario.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="var-name">{t('labels.name')}</Label>
            <Input
              id="var-name"
              aria-required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CollisionDetected"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="var-type">{t('labels.variableType')}</Label>
            <Select value={varType} onValueChange={(v) => setVarType(v as ParameterType)}>
              <SelectTrigger id="var-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIABLE_TYPES.map((vt) => (
                  <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="var-value">{t('labels.value')}</Label>
            <ParameterAwareInput
              id="var-value"
              value={value}
              onValueChange={(v) => setValue(v)}
              acceptedTypes={['string', 'double', 'int', 'boolean', 'dateTime', 'unsignedInt', 'unsignedShort']}
              placeholder="Initial value"
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
