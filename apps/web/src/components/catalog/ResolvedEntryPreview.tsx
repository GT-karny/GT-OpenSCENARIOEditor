import { useState } from 'react';
import { useTranslation } from '@osce/i18n';
import type { CatalogReference } from '@osce/shared';
import { useCatalogStore, type ResolvedCatalogEntry } from '../../stores/catalog-store';
import { applyParameterAssignments } from '@osce/openscenario';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ResolvedEntryPreviewProps {
  catalogRef: CatalogReference;
}

export function ResolvedEntryPreview({ catalogRef }: ResolvedEntryPreviewProps) {
  const { t } = useTranslation('common');
  const [expanded, setExpanded] = useState(false);
  const resolveReference = useCatalogStore((s) => s.resolveReference);

  const resolved: ResolvedCatalogEntry | null = resolveReference(catalogRef);

  if (!resolved) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Catalog not loaded or entry not found.
      </p>
    );
  }

  const effectiveDef = catalogRef.parameterAssignments.length > 0
    ? applyParameterAssignments(resolved.definition, catalogRef.parameterAssignments)
    : resolved.definition;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-[var(--color-text-primary)] transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {t('catalog.resolvedValues')}
      </button>
      {expanded && (
        <div className="pl-4 space-y-1 text-xs">
          <Row label={t('labels.name')} value={effectiveDef.name} />
          {effectiveDef.kind === 'vehicle' && (
            <>
              <Row label={t('labels.category')} value={effectiveDef.vehicleCategory} />
              <Row label="Max Speed" value={String(effectiveDef.performance.maxSpeed)} />
              <Row label="Max Accel" value={String(effectiveDef.performance.maxAcceleration)} />
              <Row label="Max Decel" value={String(effectiveDef.performance.maxDeceleration)} />
            </>
          )}
          {effectiveDef.kind === 'pedestrian' && (
            <>
              <Row label={t('labels.category')} value={effectiveDef.pedestrianCategory} />
              <Row label="Mass" value={String(effectiveDef.mass)} />
            </>
          )}
          {effectiveDef.kind === 'miscObject' && (
            <>
              <Row label={t('labels.category')} value={effectiveDef.miscObjectCategory} />
              <Row label="Mass" value={String(effectiveDef.mass)} />
            </>
          )}
          <Row
            label="BoundingBox"
            value={`${effectiveDef.boundingBox.dimensions.width}×${effectiveDef.boundingBox.dimensions.length}×${effectiveDef.boundingBox.dimensions.height}`}
          />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}
