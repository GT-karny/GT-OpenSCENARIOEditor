import { useTranslation } from '@osce/i18n';
import { useCatalogStore } from '../../stores/catalog-store';
import { cn } from '@/lib/utils';
import { BookOpen, X } from 'lucide-react';

export function CatalogList() {
  const { t } = useTranslation('common');
  const catalogs = useCatalogStore((s) => s.catalogs);
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const selectCatalog = useCatalogStore((s) => s.selectCatalog);
  const unloadCatalog = useCatalogStore((s) => s.unloadCatalog);

  const catalogNames = Array.from(catalogs.keys());

  if (catalogNames.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-xs text-muted-foreground text-center">
          {t('catalog.noCatalogs')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {catalogNames.map((name) => {
        const doc = catalogs.get(name)!;
        const isSelected = selectedCatalogName === name;
        return (
          <div
            key={name}
            className={cn(
              'group flex items-center gap-2 px-3 py-2 cursor-pointer text-xs border-b border-[var(--color-border-glass)] transition-colors',
              isSelected
                ? 'bg-[var(--color-accent-1)]/10 text-[var(--color-accent-1)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-2)]',
            )}
            onClick={() => selectCatalog(name)}
          >
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{name}</p>
              <p className="text-[10px] text-muted-foreground">
                {doc.entries.length} {t('catalog.entries').toLowerCase()}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                unloadCatalog(name);
              }}
              className="opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity"
              title={t('catalog.unloadCatalog')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
