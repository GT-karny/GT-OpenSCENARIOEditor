/**
 * OpenDRIVE side-model metadata panel (plan P9a).
 *
 * Fetches GT_esminiLib-extracted metadata for a scenario's road (parse
 * warnings, userData, signal semantics, junction priorities, crosswalks,
 * railroad, P9b virtual junctions / lane layers) and renders it as a
 * collapsible, sectioned panel. Loading/error states are shown inline (not
 * silently hidden), matching the fork.
 *
 * Ported from the GT_Sim fork's `components/OdrMetadataPanel.tsx`, retargeted
 * at `useGtSimApi()` (from `../../lib`) instead of the fork's same-origin
 * `api/client.ts`, restyled with APEX tokens / `rounded-none`. Props are kept
 * fork-compatible (`projectId` / `scenarioFile` / `defaultOpen`) so this
 * component can be embedded directly by other clusters (e.g. cluster F's
 * AnnotateView) — see this cluster's final report for the exact prop shape.
 *
 * No virtualization: the fork renders every row directly (P9a/P9b payloads
 * are bounded by a single road network's metadata), and this port keeps that
 * same tradeoff.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@osce/i18n';
import type { OdrMetadata } from '@osce/esmini';
import { useGtSimApi } from '../../lib';

export interface OdrMetadataPanelProps {
  projectId: string;
  scenarioFile: string;
  /** Collapsed by default; the header toggles the whole panel. */
  defaultOpen?: boolean;
}

export function OdrMetadataPanel({ projectId, scenarioFile, defaultOpen = false }: OdrMetadataPanelProps) {
  const { t } = useTranslation('common');
  const api = useGtSimApi();
  const [open, setOpen] = useState(defaultOpen);

  const {
    data,
    error: queryError,
    isLoading: loading,
  } = useQuery({
    queryKey: ['odr-metadata', projectId, scenarioFile],
    queryFn: () => api!.getOdrMetadata(projectId, scenarioFile),
    enabled: api !== null,
    retry: false,
  });
  const error = queryError ? (queryError instanceof Error ? queryError.message : String(queryError)) : null;

  const w = data?.warnings;
  const warnCount = w ? w.unsupported_elements + w.unsupported_attributes + w.removed16_hits : 0;
  // P9b sections may be absent from an older backend payload — degrade to empty.
  const vjs = data?.virtual_junctions ?? [];
  const laneLayers = data?.lane_layers ?? { mode: 'permanent', roads: [] };

  return (
    <div className="rounded-none border border-[var(--color-glass-edge)] text-xs">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--color-glass-hover)] rounded-none"
      >
        <span className={`text-[var(--color-text-tertiary)] transition-transform ${open ? 'rotate-90' : ''}`}>
          &rsaquo;
        </span>
        <span className="font-medium text-[var(--color-text-primary)]">{t('gtSim.odr.panel.title')}</span>
        {vjs.length > 0 && (
          <span
            className="px-1.5 py-0.5 rounded-none text-[10px] font-mono bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
            title={t('gtSim.odr.panel.virtualJunctionsBadgeTitle', { count: vjs.length })}
          >
            {t('gtSim.odr.panel.virtualJunctionsBadge', { count: vjs.length })}
          </span>
        )}
        <span
          className={`ml-auto px-1.5 py-0.5 rounded-none text-[10px] font-mono ${
            warnCount > 0
              ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
              : 'bg-[var(--color-glass-1)] text-[var(--color-text-tertiary)]'
          }`}
          title={t('gtSim.odr.panel.warningsBadgeTitle')}
        >
          {t('gtSim.odr.panel.warningsBadge', { count: warnCount })}
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3 border-t border-[var(--color-glass-edge)] pt-3">
          {loading && <div className="text-[var(--color-text-tertiary)]">{t('gtSim.odr.panel.loading')}</div>}
          {error && !loading && (
            <div className="text-[var(--color-destructive)] break-words">
              {t('gtSim.odr.panel.unavailable', { error })}
            </div>
          )}
          {data && !loading && !error && (
            <>
              <ParseWarnings warnings={data.warnings} />
              <UserDataSection
                title={t('gtSim.odr.panel.userData')}
                items={data.user_data}
                emptyText={t('gtSim.odr.panel.noUserData')}
              />
              {data.data_quality.length > 0 && (
                <UserDataSection
                  title={t('gtSim.odr.panel.dataQuality')}
                  items={data.data_quality}
                  emptyText={t('gtSim.odr.panel.noDataQuality')}
                />
              )}
              <SignalsSection signals={data.signals} />
              <VirtualJunctionsSection junctions={vjs} />
              <LaneLayersSection laneLayers={laneLayers} />
              <JunctionPrioritiesSection junctions={data.junction_priorities} />
              <CrosswalksSection crosswalks={data.crosswalks} />
              <RailroadSection railroad={data.railroad} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- section shell ---------- */

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
          {title}
        </span>
        {typeof count === 'number' && <span className="text-[10px] text-[var(--color-text-tertiary)]">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-[11px] text-[var(--color-text-tertiary)] italic">{text}</div>;
}

/* ---------- 1. parse warnings ---------- */

function ParseWarnings({ warnings }: { warnings: OdrMetadata['warnings'] }) {
  const { t } = useTranslation('common');
  const { entries, version } = warnings;
  return (
    <Section title={t('gtSim.odr.panel.parseWarnings')} count={entries.length}>
      <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">
        {t('gtSim.odr.panel.parseWarningsSummary', {
          major: version.rev_major,
          minor: version.rev_minor,
          elements: warnings.unsupported_elements,
          attributes: warnings.unsupported_attributes,
          removed: warnings.removed16_hits,
        })}
      </div>
      {entries.length === 0 ? (
        <Empty text={t('gtSim.odr.panel.noUnsupportedConstructs')} />
      ) : (
        <div className="max-h-40 overflow-auto rounded-none bg-[var(--color-glass-1)] p-1.5">
          {entries.map((e, i) => (
            <div
              key={i}
              className="font-mono text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap break-all leading-snug"
            >
              {e}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- 2. userData / dataQuality ---------- */

function UserDataSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: OdrMetadata['user_data'];
  emptyText: string;
}) {
  const { t } = useTranslation('common');
  // Group by context_id (road).
  const groups = new Map<string, OdrMetadata['user_data']>();
  for (const it of items) {
    const key = it.context_id || '(none)';
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }

  return (
    <Section title={title} count={items.length}>
      {items.length === 0 ? (
        <Empty text={emptyText} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {[...groups.entries()].map(([ctx, rows]) => (
            <div key={ctx} className="flex flex-col gap-1">
              <div className="text-[10px] text-[var(--color-text-tertiary)]">
                {t('gtSim.odr.panel.roadContext', { id: ctx })}
              </div>
              {rows.map((r, i) => (
                <UserDataItem key={i} item={r} />
              ))}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function UserDataItem({ item }: { item: OdrMetadata['user_data'][number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-none bg-[var(--color-glass-1)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-left hover:bg-[var(--color-glass-2)] rounded-none"
      >
        <span className={`text-[var(--color-text-tertiary)] transition-transform ${open ? 'rotate-90' : ''}`}>
          &rsaquo;
        </span>
        <span className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate">{item.owner_path}</span>
      </button>
      {open && (
        <pre className="max-h-40 overflow-auto px-2 pb-2 font-mono text-[10px] text-[var(--color-text-secondary)] whitespace-pre-wrap break-all">
          {item.xml}
        </pre>
      )}
    </div>
  );
}

/* ---------- 3. signals (semantics) ---------- */

function SignalsSection({ signals }: { signals: OdrMetadata['signals'] }) {
  const { t } = useTranslation('common');
  return (
    <Section title={t('gtSim.odr.panel.signals')} count={signals.length}>
      {signals.length === 0 ? (
        <Empty text={t('gtSim.odr.panel.noSignals')} />
      ) : (
        <div className="overflow-x-auto rounded-none bg-[var(--color-glass-1)]">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] text-left">
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableRoad')}</th>
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableSignal')}</th>
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableSummary')}</th>
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableFlags')}</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s, i) => (
                <tr key={i} className="border-t border-[var(--color-glass-edge)] align-top">
                  <td className="px-1.5 py-1 font-mono text-[var(--color-text-secondary)]">{s.road_id}</td>
                  <td className="px-1.5 py-1 font-mono text-[var(--color-text-secondary)]">{s.signal_id}</td>
                  <td className="px-1.5 py-1 text-[var(--color-text-secondary)]">
                    {s.has_semantics ? (
                      <span className="flex flex-wrap gap-x-2">
                        {s.semantics.speeds.length > 0 && (
                          <span>{t('gtSim.odr.panel.speedsCount', { count: s.semantics.speeds.length })}</span>
                        )}
                        {s.semantics.lane_types.length > 0 && (
                          <span>{t('gtSim.odr.panel.lanesList', { list: s.semantics.lane_types.join(',') })}</span>
                        )}
                        {s.semantics.priority_types.length > 0 && (
                          <span>
                            {t('gtSim.odr.panel.priorityList', { list: s.semantics.priority_types.join(',') })}
                          </span>
                        )}
                        {s.semantics.prohibited.length > 0 && (
                          <span>{t('gtSim.odr.panel.prohibitedCount', { count: s.semantics.prohibited.length })}</span>
                        )}
                        {s.semantics.warning_count > 0 && (
                          <span className="text-[var(--color-warning)]">
                            {t('gtSim.odr.panel.warnCount', { count: s.semantics.warning_count })}
                          </span>
                        )}
                        {(s.dependencies.length > 0 || s.references.length > 0) && (
                          <span className="text-[var(--color-text-tertiary)]">
                            {t('gtSim.odr.panel.depRefCount', {
                              dep: s.dependencies.length,
                              ref: s.references.length,
                            })}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-tertiary)] italic">{t('gtSim.odr.panel.noSemantics')}</span>
                    )}
                  </td>
                  <td className="px-1.5 py-1">
                    {s.temporary && (
                      <span className="text-[var(--color-warning)] mr-1">{t('gtSim.odr.panel.flagTemporary')}</span>
                    )}
                    {s.invalidated && (
                      <span className="text-[var(--color-destructive)]">{t('gtSim.odr.panel.flagInvalidated')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* ---------- 3b. virtual junctions (P9b / P6) ---------- */

/**
 * Span marker: the [s_start, s_end] window rendered against the main road's
 * full length as a horizontal bar. Falls back to text-only when the road
 * length is unknown (<= 0).
 */
function SpanBar({ start, end, total, title }: { start: number; end: number; total: number; title?: string }) {
  if (!(total > 0) || end < start) return null;
  const left = Math.max(0, Math.min(100, (start / total) * 100));
  const width = Math.max(1, Math.min(100 - left, ((end - start) / total) * 100));
  return (
    <div className="relative h-1.5 rounded-none bg-[var(--color-glass-2)] overflow-hidden" title={title}>
      <div
        className="absolute top-0 h-full bg-[var(--color-primary)]/70 rounded-none"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    </div>
  );
}

function VirtualJunctionsSection({ junctions }: { junctions: OdrMetadata['virtual_junctions'] }) {
  const { t } = useTranslation('common');
  if (junctions.length === 0) return null; // sparse: hide entirely on legacy assets
  return (
    <Section title={t('gtSim.odr.panel.virtualJunctions')} count={junctions.length}>
      <div className="flex flex-col gap-1.5">
        {junctions.map((vj, i) => (
          <div key={i} className="rounded-none bg-[var(--color-glass-1)] px-2 py-1 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1 py-0.5 rounded-none text-[9px] font-mono bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
                {t('gtSim.odr.panel.virtualJunctionBadge')}
              </span>
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {vj.junction_id}
                {vj.name && <span className="text-[var(--color-text-tertiary)]"> ({vj.name})</span>}
              </span>
            </div>
            <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
              {t('gtSim.odr.panel.virtualJunctionSummary', {
                roadId: vj.main_road_id,
                start: vj.s_start,
                end: vj.s_end,
              })}
              {vj.orientation && <> · {t('gtSim.odr.panel.orientation', { orientation: vj.orientation })}</>}
              {' · '}
              {t('gtSim.odr.panel.anchorCount', { count: vj.anchor_count })} ·{' '}
              {t('gtSim.odr.panel.connectionCount', { count: vj.connection_count })}
            </div>
            <SpanBar
              start={vj.s_start}
              end={vj.s_end}
              total={vj.main_road_length}
              title={t('gtSim.odr.panel.virtualJunctionSpanTitle', {
                junctionId: vj.junction_id,
                start: vj.s_start,
                end: vj.s_end,
                roadId: vj.main_road_id,
                length: vj.main_road_length,
              })}
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ---------- 3c. lane layers (P9b / P8) ---------- */

function LaneLayersSection({ laneLayers }: { laneLayers: OdrMetadata['lane_layers'] }) {
  const { t } = useTranslation('common');
  const { mode, roads } = laneLayers;
  if (roads.length === 0) return null; // sparse: only 1.9 multi-layer assets appear
  return (
    <Section title={t('gtSim.odr.panel.laneLayers')} count={roads.length}>
      <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">
        {t('gtSim.odr.panel.laneLayersProcessMode')}{' '}
        <span className={`font-mono ${mode === 'temporary' ? 'text-[var(--color-warning)]' : ''}`}>{mode}</span>{' '}
        {t('gtSim.odr.panel.laneLayersProcessModeSuffix')}
      </div>
      <div className="flex flex-col gap-1.5">
        {roads.map((rd, i) => {
          // Scale for the coverage bar: furthest authored s across all layers,
          // or the temporary range end when it reaches beyond.
          const maxS = Math.max(
            rd.temp_s_end,
            ...rd.layers.flatMap((l) => l.sections.map((sec) => sec.s + (sec.has_length ? sec.length : 0))),
          );
          return (
            <div key={i} className="rounded-none bg-[var(--color-glass-1)] px-2 py-1 flex flex-col gap-1">
              <div className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {t('gtSim.odr.panel.laneLayersRoad', { id: rd.road_id })}
                <span className="text-[var(--color-text-tertiary)]">
                  {' '}
                  · {t('gtSim.odr.panel.laneLayersActive', { mode: rd.active_mode })}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                {rd.layers.map((l, k) => (
                  <span key={k}>
                    {k > 0 && ' · '}
                    {t('gtSim.odr.panel.laneLayerSectionCount', { name: l.name, count: l.sections.length })}
                    {l.lane_offset_count > 0 && (
                      <>, {t('gtSim.odr.panel.laneLayerOffsetCount', { count: l.lane_offset_count })}</>
                    )}
                  </span>
                ))}
              </div>
              {rd.has_temporary && (
                <>
                  <div className="font-mono text-[10px] text-[var(--color-warning)]">
                    {t('gtSim.odr.panel.laneLayersTemporaryCovers', {
                      start: rd.temp_s_start,
                      end: rd.temp_s_end,
                    })}
                  </div>
                  <SpanBar
                    start={rd.temp_s_start}
                    end={rd.temp_s_end}
                    total={maxS}
                    title={t('gtSim.odr.panel.laneLayersTemporaryCoverageTitle', {
                      start: rd.temp_s_start,
                      end: rd.temp_s_end,
                    })}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------- 4. junction priorities ---------- */

function JunctionPrioritiesSection({ junctions }: { junctions: OdrMetadata['junction_priorities'] }) {
  const { t } = useTranslation('common');
  return (
    <Section title={t('gtSim.odr.panel.junctionPriorities')} count={junctions.length}>
      {junctions.length === 0 ? (
        <Empty text={t('gtSim.odr.panel.noJunctionPriorities')} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {junctions.map((j, i) => (
            <div key={i} className="rounded-none bg-[var(--color-glass-1)] px-2 py-1">
              <div className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {t('gtSim.odr.panel.junctionLabel', { id: j.junction_id })}
                {j.type && <span className="text-[var(--color-text-tertiary)]"> ({j.type})</span>}
              </div>
              {j.priorities.length === 0 ? (
                <div className="text-[10px] text-[var(--color-text-tertiary)] italic">
                  {t('gtSim.odr.panel.noPairs')}
                </div>
              ) : (
                <div className="flex flex-col">
                  {j.priorities.map((p, k) => (
                    <span key={k} className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                      {p.high} &gt; {p.low}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- 5. crosswalks ---------- */

function CrosswalksSection({ crosswalks }: { crosswalks: OdrMetadata['crosswalks'] }) {
  const { t } = useTranslation('common');
  return (
    <Section title={t('gtSim.odr.panel.crosswalks')} count={crosswalks.length}>
      {crosswalks.length === 0 ? (
        <Empty text={t('gtSim.odr.panel.noCrosswalks')} />
      ) : (
        <div className="overflow-x-auto rounded-none bg-[var(--color-glass-1)]">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] text-left">
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableJunction')}</th>
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableId')}</th>
                <th className="px-1.5 py-1 font-medium">{t('gtSim.odr.panel.tableCrossingRoad')}</th>
              </tr>
            </thead>
            <tbody>
              {crosswalks.map((c, i) => (
                <tr key={i} className="border-t border-[var(--color-glass-edge)]">
                  <td className="px-1.5 py-1 font-mono text-[var(--color-text-secondary)]">{c.junction_id}</td>
                  <td className="px-1.5 py-1 font-mono text-[var(--color-text-secondary)]">{c.id}</td>
                  <td className="px-1.5 py-1 font-mono text-[var(--color-text-secondary)]">{c.crossing_road}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* ---------- 6. railroad (inert) ---------- */

function RailroadSection({ railroad }: { railroad: OdrMetadata['railroad'] }) {
  const { t } = useTranslation('common');
  const { switches, stations } = railroad;
  const empty = switches.length === 0 && stations.length === 0;
  const unnamed = t('gtSim.odr.panel.unnamed');
  return (
    <Section title={t('gtSim.odr.panel.railroad')} count={switches.length + stations.length}>
      <div className="text-[10px] text-[var(--color-text-tertiary)] italic mb-1">
        {t('gtSim.odr.panel.railroadInert')}
      </div>
      {empty ? (
        <Empty text={t('gtSim.odr.panel.noRailroadData')} />
      ) : (
        <div className="flex flex-col gap-2">
          {switches.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] text-[var(--color-text-tertiary)]">
                {t('gtSim.odr.panel.switchesCount', { count: switches.length })}
              </div>
              {switches.map((sw, i) => (
                <div
                  key={i}
                  className="rounded-none bg-[var(--color-glass-1)] px-2 py-1 font-mono text-[10px] text-[var(--color-text-secondary)]"
                >
                  <div>
                    {t('gtSim.odr.panel.switchSummary', {
                      roadId: sw.road_id,
                      name: sw.name || unnamed,
                      id: sw.id,
                      position: sw.position,
                    })}
                  </div>
                  <div className="text-[var(--color-text-tertiary)]">
                    {t('gtSim.odr.panel.switchTracks', {
                      mainId: sw.main_track?.id,
                      mainS: sw.main_track?.s,
                      sideId: sw.side_track?.id,
                      sideS: sw.side_track?.s,
                    })}
                    {sw.partner && (
                      <>
                        {' '}
                        · {t('gtSim.odr.panel.switchPartner', { partner: sw.partner.name || sw.partner.id })}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {stations.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] text-[var(--color-text-tertiary)]">
                {t('gtSim.odr.panel.stationsCount', { count: stations.length })}
              </div>
              {stations.map((st, i) => (
                <div
                  key={i}
                  className="rounded-none bg-[var(--color-glass-1)] px-2 py-1 text-[10px] text-[var(--color-text-secondary)]"
                >
                  <div className="font-mono">
                    {t('gtSim.odr.panel.stationSummary', { id: st.id, name: st.name || unnamed })}
                    {st.type && <span className="text-[var(--color-text-tertiary)]"> ({st.type})</span>}
                  </div>
                  {st.platforms.map((pf, k) => (
                    <div key={k} className="text-[var(--color-text-tertiary)] font-mono pl-2">
                      {t('gtSim.odr.panel.platformSummary', {
                        id: pf.id,
                        name: pf.name ? ` (${pf.name})` : '',
                      })}{' '}
                      {pf.segments.map((sg, m) => (
                        <span key={m}>
                          {m > 0 && ', '}
                          {t('gtSim.odr.panel.platformSegment', {
                            roadId: sg.road_id,
                            start: sg.s_start,
                            end: sg.s_end,
                            side: sg.side,
                          })}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
