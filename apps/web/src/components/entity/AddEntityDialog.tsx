import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import type { EntityType } from '@osce/shared';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useScenarioStoreApi } from '../../stores/use-scenario-store';

interface AddEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEntityDialog({ open, onOpenChange }: AddEntityDialogProps) {
  const { t } = useTranslation('common');
  const storeApi = useScenarioStoreApi();
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('vehicle');

  const handleAdd = () => {
    if (!name.trim()) return;

    const definition = createDefaultDefinition(entityType, name.trim());
    storeApi.getState().addEntity({
      name: name.trim(),
      type: entityType,
      definition,
    });

    setName('');
    setEntityType('vehicle');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('buttons.add')} Entity</DialogTitle>
          <DialogDescription>Add a new entity to the scenario.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="entity-name">{t('labels.name')}</Label>
            <Input
              id="entity-name"
              aria-required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ego, TargetVehicle"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entity-type">{t('labels.type')}</Label>
            <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
              <SelectTrigger id="entity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="pedestrian">Pedestrian</SelectItem>
                <SelectItem value="miscObject">Misc Object</SelectItem>
              </SelectContent>
            </Select>
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

function createDefaultDefinition(type: EntityType, name: string) {
  const defaultBoundingBox = {
    center: { x: 1.4, y: 0, z: 0.9 },
    dimensions: { width: 2.0, length: 4.5, height: 1.8 },
  };

  switch (type) {
    case 'vehicle':
      return {
        kind: 'vehicle' as const,
        name,
        vehicleCategory: 'car' as const,
        performance: { maxSpeed: 69.444, maxAcceleration: 200, maxDeceleration: 10 },
        boundingBox: defaultBoundingBox,
        axles: {
          frontAxle: {
            maxSteering: 0.5,
            wheelDiameter: 0.6,
            trackWidth: 1.8,
            positionX: 3.1,
            positionZ: 0.3,
          },
          rearAxle: {
            maxSteering: 0,
            wheelDiameter: 0.6,
            trackWidth: 1.8,
            positionX: 0,
            positionZ: 0.3,
          },
          additionalAxles: [],
        },
        parameterDeclarations: [],
        properties: [],
      };
    case 'pedestrian':
      return {
        kind: 'pedestrian' as const,
        name,
        pedestrianCategory: 'pedestrian' as const,
        mass: 75,
        model: 'walker',
        parameterDeclarations: [],
        boundingBox: {
          center: { x: 0, y: 0, z: 0.9 },
          dimensions: { width: 0.5, length: 0.3, height: 1.8 },
        },
        properties: [],
      };
    case 'miscObject':
      return {
        kind: 'miscObject' as const,
        name,
        miscObjectCategory: 'obstacle' as const,
        mass: 100,
        parameterDeclarations: [],
        boundingBox: defaultBoundingBox,
        properties: [],
      };
  }
}
