import { CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useValidation } from '../../hooks/use-validation';

export function ValidateButton() {
  const { runValidation } = useValidation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={runValidation}>
          <CheckCircle className="h-4 w-4" />
          Validate
        </Button>
      </TooltipTrigger>
      <TooltipContent>Validate scenario</TooltipContent>
    </Tooltip>
  );
}
