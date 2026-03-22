import { CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useValidation } from '../../hooks/use-validation';

export function ValidateButton({ compact }: { compact?: boolean }) {
  const { runValidation } = useValidation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'icon' : 'sm'}
          className={compact ? 'h-8 w-8' : 'text-xs gap-1'}
          onClick={runValidation}
        >
          <CheckCircle className="h-4 w-4" />
          {!compact && 'Validate'}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Validate scenario</TooltipContent>
    </Tooltip>
  );
}
