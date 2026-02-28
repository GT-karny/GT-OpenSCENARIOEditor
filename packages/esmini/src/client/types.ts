/** Configuration for connecting to GT_Sim. */
export interface GtSimConfig {
  /** REST API base URL (default: "http://127.0.0.1:8000") */
  restBaseUrl: string;
  /** gRPC endpoint (default: "127.0.0.1:50051") */
  grpcHost: string;
  /** REST API timeout in ms (default: 30000) */
  timeout?: number;
}

/** Default configuration values. */
export const DEFAULT_GT_SIM_CONFIG: GtSimConfig = {
  restBaseUrl: 'http://127.0.0.1:8000',
  grpcHost: '127.0.0.1:50051',
  timeout: 30_000,
};

/** POST /api/scenarios/upload response. */
export interface ScenarioUploadResponse {
  scenario_id: string;
  entities: Array<{ name: string; model: string }>;
  road_file: string;
  expires_at: string;
}

/** POST /api/simulations response. */
export interface CreateSimulationResponse {
  job_id: string;
  status: string;
}

/** GET /api/simulations/{job_id} response. */
export interface SimulationStatusResponse {
  job_id: string;
  status: string;
  progress?: number;
}

/** GET /api/results/{job_id} response. */
export interface SimulationResultsResponse {
  job_id: string;
  status: string;
  metrics?: Record<string, unknown>;
}
