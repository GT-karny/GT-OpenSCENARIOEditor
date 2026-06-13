/**
 * Classifies raw esmini-worker error messages into user-facing i18n keys.
 *
 * The worker surfaces failures as plain strings:
 *   - Emscripten module load / init failures
 *   - esmini SE_Init failures (bad scenario, missing road, missing catalog)
 *   - runtime step crashes ("Playback crashed: ...")
 *   - load timeouts (from the service)
 *
 * This pure mapping keeps the UI layer free of brittle string matching and is
 * unit-tested independently of React.
 */

export type SimErrorKind =
  | 'timeout'
  | 'missingRoad'
  | 'missingCatalogs'
  | 'initFailed'
  | 'runtimeError'
  | 'workerError'
  | 'noFrames';

export interface ClassifiedSimError {
  /** i18n key under the `simulation` namespace of `common`. */
  key: `simulation.${SimErrorKind}`;
  /** Interpolation values for the i18n message ({{message}}). */
  message: string;
}

/** Normalize an unknown error into a string message. */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}

/**
 * Map a raw worker/service error string to an i18n key + interpolation values.
 *
 * Matching is intentionally lenient (case-insensitive substring) because esmini
 * error text is not a stable contract; the fallback is a generic runtime error
 * so nothing is ever swallowed.
 */
export function classifySimError(raw: unknown): ClassifiedSimError {
  const message = toErrorMessage(raw).trim();
  const lower = message.toLowerCase();

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return { key: 'simulation.timeout', message };
  }

  // Missing / unloadable road network (.xodr)
  if (
    (lower.includes('.xodr') || lower.includes('opendrive') || lower.includes('odrmanager')) &&
    (lower.includes('not found') ||
      lower.includes('failed') ||
      lower.includes('could not') ||
      lower.includes("couldn't") ||
      lower.includes('no such') ||
      lower.includes('missing') ||
      lower.includes('load'))
  ) {
    return { key: 'simulation.missingRoad', message };
  }

  // Missing / unresolvable catalog entries. esmini also reports unresolved
  // catalog references as "Couldn't locate OpenSCENARIO file <CatalogName>".
  if (
    (lower.includes('catalog') &&
      (lower.includes('not found') ||
        lower.includes('missing') ||
        lower.includes('could not') ||
        lower.includes("couldn't") ||
        lower.includes('failed') ||
        lower.includes('unresolved') ||
        lower.includes('no entry'))) ||
    (lower.includes('locate') && lower.includes('openscenario file'))
  ) {
    return { key: 'simulation.missingCatalogs', message };
  }

  // Runtime crash during the step loop
  if (lower.includes('playback crashed') || lower.includes('step')) {
    return { key: 'simulation.runtimeError', message };
  }

  // Worker / module-level unrecoverable crash
  if (
    lower.includes('worker') ||
    lower.includes('abort') ||
    lower.includes('out of memory') ||
    lower.includes('wasm') ||
    lower.includes('runtimeerror')
  ) {
    return { key: 'simulation.workerError', message };
  }

  // Anything else from SE_Init (parse errors, invalid scenario, etc.)
  return { key: 'simulation.initFailed', message };
}
