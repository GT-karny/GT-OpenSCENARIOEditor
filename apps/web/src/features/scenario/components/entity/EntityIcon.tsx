import { Car, PersonStanding, Box } from 'lucide-react';
import type { EntityType } from '@osce/shared';

interface EntityIconProps {
  type: EntityType;
  className?: string;
}

export function EntityIcon({ type, className = 'h-4 w-4' }: EntityIconProps) {
  switch (type) {
    case 'vehicle':
      return <Car className={className} />;
    case 'pedestrian':
      return <PersonStanding className={className} />;
    case 'miscObject':
      return <Box className={className} />;
    default:
      return <Box className={className} />;
  }
}
