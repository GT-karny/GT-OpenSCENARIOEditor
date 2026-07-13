/**
 * `IGtSimWsService` — the WS-backed GT_Sim service contract (implementation:
 * WP1, `GtSimWsService`). It is `@osce/shared`'s `IEsminiService` plus
 * `onError`, so the editor's WASM (`EsminiWasmService`) and GT_Sim execution
 * paths are interchangeable behind the shared interface.
 *
 * `IEsminiService` itself is NOT modified (it lives in the immutable
 * `@osce/shared` package and has no `onError`); this interface extends it here
 * in `@osce/esmini` instead.
 */

import type { IEsminiService } from '@osce/shared';

export interface IGtSimWsService extends IEsminiService {
  /**
   * Subscribe to service-level errors (backend/WS/transport failures) that have
   * no equivalent on `IEsminiService`. Returns an unsubscribe function.
   */
  onError(callback: (error: Error) => void): () => void;
}
