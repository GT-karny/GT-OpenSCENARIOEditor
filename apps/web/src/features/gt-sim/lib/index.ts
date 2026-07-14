/**
 * `features/gt-sim/lib` barrel — the API access layer shared by all execution
 * clusters. Import from `@/features/gt-sim/lib`; see `README.md` for usage.
 */
export {
  useGtSimApi,
  getGtSimApi,
  useGtSimWsBaseUrl,
  getGtSimWsBaseUrl,
  wsBaseUrlFromRest,
} from './api';

// Re-exported from @osce/esmini so clusters build stream URLs without a
// direct package import for URL concerns (host injection stays centralized:
// pair these with useGtSimWsBaseUrl()/getGtSimWsBaseUrl()).
export {
  gtSimOsiWsUrl,
  gtSimVdWsUrl,
  gtSimSvWsUrl,
  gtSimPresetsWsUrl,
  gtSimInputWsUrl,
} from '@osce/esmini';

// Convenience type re-export: the concrete client type returned by
// useGtSimApi()/getGtSimApi().
export type { GtSimApiClient } from '@osce/esmini';
