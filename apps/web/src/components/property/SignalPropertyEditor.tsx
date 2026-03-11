/**
 * Read-only property editor for an OpenDRIVE traffic signal.
 * Shows signal metadata and associated controllers.
 */

import { TrafficCone } from 'lucide-react';
import type { OdrSignal, OdrRoad, OdrController } from '@osce/shared';
import { classifySignal } from '@osce/3d-viewer';

interface SignalPropertyEditorProps {
  signal: OdrSignal;
  road: OdrRoad;
  controllers: OdrController[];
}

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  if (value === undefined || value === '') return null;
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-mono text-right truncate">{String(value)}</span>
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  trafficLight: 'Traffic Light',
  stopSign: 'Stop Sign',
  speedLimit: 'Speed Limit',
  generic: 'Signal',
};

export function SignalPropertyEditor({ signal, road, controllers }: SignalPropertyEditorProps) {
  const category = classifySignal(signal);
  const relatedControllers = controllers.filter((c) =>
    c.controls.some((ctrl) => ctrl.signalId === signal.id),
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <TrafficCone className="h-5 w-5 text-amber-400 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{signal.name ?? signal.id}</p>
          <p className="text-xs text-muted-foreground">{categoryLabels[category] ?? category}</p>
        </div>
      </div>

      {/* Identity */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Identity
        </p>
        <Field label="ID" value={signal.id} />
        {signal.name && <Field label="Name" value={signal.name} />}
        <Field label="Road" value={`${road.name ?? road.id} (${road.id})`} />
      </div>

      {/* Position */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Position
        </p>
        <Field label="s" value={signal.s} />
        <Field label="t" value={signal.t} />
        <Field label="zOffset" value={signal.zOffset} />
        <Field label="Orientation" value={signal.orientation} />
        <Field label="hOffset" value={signal.hOffset} />
        <Field label="Pitch" value={signal.pitch} />
        <Field label="Roll" value={signal.roll} />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          Type
        </p>
        <Field label="Type" value={signal.type} />
        <Field label="Subtype" value={signal.subtype} />
        <Field label="Country" value={signal.country} />
        <Field label="Value" value={signal.value} />
        <Field label="Text" value={signal.text} />
        <Field label="Dynamic" value={signal.dynamic} />
      </div>

      {/* Dimensions */}
      {(signal.width !== undefined || signal.height !== undefined) && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Dimensions
          </p>
          <Field label="Width" value={signal.width} />
          <Field label="Height" value={signal.height} />
        </div>
      )}

      {/* Controllers */}
      {relatedControllers.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Controllers
          </p>
          {relatedControllers.map((ctrl) => (
            <div
              key={ctrl.id}
              className="text-xs bg-muted/50 rounded px-2 py-1 space-y-0.5"
            >
              <div className="font-medium">{ctrl.name}</div>
              <div className="text-muted-foreground">ID: {ctrl.id}</div>
              {ctrl.sequence !== undefined && (
                <div className="text-muted-foreground">Sequence: {ctrl.sequence}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
