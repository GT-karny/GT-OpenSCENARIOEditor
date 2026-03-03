import { useTranslation } from '@osce/i18n';
import { useCatalogStore } from '../../stores/catalog-store';
import { Label } from '../ui/label';
import { EnumSelect } from '../property/EnumSelect';

interface CatalogPickerProps {
  catalogName: string;
  entryName: string;
  onCatalogNameChange: (name: string) => void;
  onEntryNameChange: (name: string) => void;
}

export function CatalogPicker({
  catalogName,
  entryName,
  onCatalogNameChange,
  onEntryNameChange,
}: CatalogPickerProps) {
  const { t } = useTranslation('common');
  const getCatalogNames = useCatalogStore((s) => s.getCatalogNames);
  const getEntryNames = useCatalogStore((s) => s.getEntryNames);

  const catalogNames = getCatalogNames();
  const entryNames = catalogName ? getEntryNames(catalogName) : [];

  return (
    <div className="space-y-2">
      <div className="grid gap-1">
        <Label className="text-xs">{t('catalog.catalogName')}</Label>
        {catalogNames.length > 0 ? (
          <EnumSelect
            value={catalogName}
            options={catalogNames}
            onValueChange={onCatalogNameChange}
            className="h-8 text-sm"
          />
        ) : (
          <p className="text-xs text-muted-foreground italic">{t('catalog.noCatalogs')}</p>
        )}
      </div>
      {catalogName && (
        <div className="grid gap-1">
          <Label className="text-xs">{t('catalog.entryName')}</Label>
          {entryNames.length > 0 ? (
            <EnumSelect
              value={entryName}
              options={entryNames}
              onValueChange={onEntryNameChange}
              className="h-8 text-sm"
            />
          ) : (
            <p className="text-xs text-muted-foreground italic">{t('catalog.noEntries')}</p>
          )}
        </div>
      )}
    </div>
  );
}
