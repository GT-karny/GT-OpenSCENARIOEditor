import { useTranslation } from '@osce/i18n';
import { BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useCatalogStore } from '../../stores/catalog-store';

export function CatalogButton({ compact }: { compact?: boolean }) {
  const { t } = useTranslation('common');
  const openEditor = useCatalogStore((s) => s.openEditor);
  const catalogCount = useCatalogStore((s) => s.catalogs.size);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={catalogCount > 0 ? 'secondary' : 'ghost'}
          size={compact ? 'icon' : 'sm'}
          className={compact ? 'h-8 w-8' : 'text-xs gap-1'}
          onClick={openEditor}
        >
          <BookOpen className="h-4 w-4" />
          {!compact && (
            <>
              {t('catalog.catalogs')}
              {catalogCount > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">({catalogCount})</span>
              )}
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {t('catalog.editor')}
        {compact && catalogCount > 0 && ` (${catalogCount})`}
      </TooltipContent>
    </Tooltip>
  );
}
