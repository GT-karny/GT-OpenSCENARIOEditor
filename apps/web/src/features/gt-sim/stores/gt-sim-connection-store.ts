/**
 * GT_Sim backend connection store (execution-mode boundary state).
 *
 * This is the single Zustand store that supplies the resolved backend
 * `endpoints` and lifecycle `state` to every execution-mode panel. Per design
 * judgment D5, react-query lives inside `features/gt-sim`; any state that must
 * cross the feature boundary (endpoints, status) travels through this store, not
 * react-query.
 *
 * Wiring model (contract agreed with lane L2 / `@osce/shared` gt-sim-ipc):
 *  - Electron: subscribe to `window.electronAPI.onGtSimStatus` for lifecycle
 *    pushes and prime once via `gtSimGetEndpoints()`. The main process re-sends
 *    the current status on `did-finish-load`, so a late subscriber is fine.
 *  - There is no explicit `disabled` state in the contract: "no status push ever
 *    received + endpoints=null" means the backend was not started / is disabled
 *    for this launch — surfaced as `disconnected`.
 *  - Browser dev fallback: no Electron bridge exists, so endpoints can be
 *    supplied by `VITE_GTSIM_REST_URL` (or set manually via `setManualEndpoints`).
 */
import { create } from 'zustand';
import type {
  GtSimEndpoints,
  GtSimBackendStatus,
  GtSimBackendState,
  GtSimConnectConfig,
} from '@osce/shared';

/**
 * Whether an Electron GT_Sim backend bridge exists in this runtime. A module
 * constant (the preload API is injected before any renderer code runs), so the
 * very first paint already knows — no store-update flicker.
 */
export const hasGtSimBridge: boolean =
  typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

/**
 * UI-facing connection state. Extends the backend {@link GtSimBackendState} with
 * `disconnected` — the resting state when no backend bridge is present (a plain
 * browser) or before the first status push has arrived (= backend not started).
 */
export type GtSimConnectionState = GtSimBackendState | 'disconnected';

interface GtSimConnectionStore {
  /** Lifecycle state driving the status banner and panel gating. */
  state: GtSimConnectionState;
  /** Resolved endpoints, or `null` until the backend is `ready`. */
  endpoints: GtSimEndpoints | null;
  /** Human-readable detail (set on `failed` / `crashed`). */
  message?: string;
  /** Backend OS process id, when known. */
  pid?: number;
  /**
   * True once at least one `gtsim:status` push has been applied. Push data is
   * authoritative; the one-shot `gtSimGetEndpoints()` priming is only trusted
   * while this is false (an in-flight invoke resolving after a `crashed` push
   * must not resurrect a stale `ready`).
   */
  receivedStatusPush: boolean;

  /** Apply a lifecycle push from the main process (authoritative). */
  applyStatus: (status: GtSimBackendStatus) => void;
  /**
   * Apply the result of the one-shot `gtSimGetEndpoints()` priming invoke.
   * Ignored once any status push has been received (pushes win the race).
   */
  primeEndpoints: (endpoints: GtSimEndpoints) => void;
  /**
   * Dev fallback: point the clients at a manually specified REST base URL. The
   * WS base is derived by swapping the scheme (`http`→`ws`, `https`→`wss`).
   */
  setManualEndpoints: (restBaseUrl: string) => void;
  /**
   * Delegate a connect request (settings panel "Connect" button) to the main
   * process. Thin wrapper only — the actual outcome always arrives via
   * `applyStatus` (the `gtsim:status` push); this promise settling just tells
   * the caller the request round-tripped, for button loading state. Throws if
   * no Electron bridge is present (browser dev) or the connect itself failed.
   */
  requestConnect: (config: GtSimConnectConfig) => Promise<void>;
  /** Reset to the disconnected resting state (used on unmount / teardown). */
  reset: () => void;
}

/** Derive a `ws(s)://` base URL from an `http(s)://` REST base URL. */
function wsFromRest(restBaseUrl: string): string {
  return /^https:/i.test(restBaseUrl)
    ? restBaseUrl.replace(/^https:/i, 'wss:')
    : restBaseUrl.replace(/^http:/i, 'ws:');
}

const initialState = {
  state: 'disconnected' as GtSimConnectionState,
  endpoints: null,
  message: undefined,
  pid: undefined,
  receivedStatusPush: false,
};

export const useGtSimConnectionStore = create<GtSimConnectionStore>((set, get) => ({
  ...initialState,

  applyStatus: (status) =>
    set({
      state: status.state,
      endpoints: status.endpoints ?? null,
      message: status.message,
      pid: status.pid,
      receivedStatusPush: true,
    }),

  primeEndpoints: (endpoints) => {
    if (get().receivedStatusPush) return;
    set({ state: 'ready', endpoints, message: undefined });
  },

  setManualEndpoints: (restBaseUrl) => {
    const trimmed = restBaseUrl.replace(/\/+$/, '');
    set({
      state: 'ready',
      endpoints: {
        restBaseUrl: trimmed,
        wsBaseUrl: wsFromRest(trimmed),
        // gRPC is unused by the renderer (D1); 0 marks "not applicable".
        grpcPort: 0,
      },
      message: undefined,
    });
  },

  requestConnect: async (config) => {
    const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
    if (!api?.gtSimConnect) {
      throw new Error('GT_Sim connect bridge unavailable in this runtime (browser dev)');
    }
    // The status push (subscribed via `initGtSimConnection`) applies the
    // resulting state; a rejection here still means the caller should surface
    // an error even if the push races the invoke's own rejection.
    await api.gtSimConnect(config);
  },

  reset: () => set({ ...initialState }),
}));

/**
 * Connect the store to the runtime backend bridge. Call once from a mounted
 * execution-mode component; returns a cleanup that unsubscribes.
 *
 * Electron: subscribes to status pushes and primes endpoints. Browser dev:
 * applies `VITE_GTSIM_REST_URL` if set, otherwise stays `disconnected`.
 */
export function initGtSimConnection(): () => void {
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
  const { applyStatus, primeEndpoints, setManualEndpoints, reset } =
    useGtSimConnectionStore.getState();

  if (hasGtSimBridge && api?.onGtSimStatus) {
    const unsubscribe = api.onGtSimStatus((status) => applyStatus(status));

    // Prime endpoints in case the backend was already `ready` before we
    // subscribed (belt-and-suspenders alongside the main-side re-send).
    // `primeEndpoints` defers to any status push that has already landed.
    if (api.gtSimGetEndpoints) {
      void api.gtSimGetEndpoints().then((endpoints) => {
        if (endpoints) primeEndpoints(endpoints);
      });
    }

    return () => {
      unsubscribe();
    };
  }

  // Browser dev fallback: optional manual endpoint via Vite env.
  const devUrl = import.meta.env.VITE_GTSIM_REST_URL as string | undefined;
  if (devUrl) {
    setManualEndpoints(devUrl);
  } else {
    reset();
  }
  return () => {
    /* no bridge to tear down */
  };
}
