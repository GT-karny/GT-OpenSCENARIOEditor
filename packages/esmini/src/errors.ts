/** Base error for all GT_Sim related errors. */
export class GtSimError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'GtSimError';
  }
}

/** REST API returned a non-2xx status. */
export class GtSimApiError extends GtSimError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
  ) {
    super(message, 'API_ERROR');
    this.name = 'GtSimApiError';
  }
}

/** Network-level error (connection refused, timeout, DNS failure). */
export class GtSimNetworkError extends GtSimError {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message, 'NETWORK_ERROR');
    this.name = 'GtSimNetworkError';
  }
}

/** gRPC stream error. */
export class GtSimGrpcError extends GtSimError {
  constructor(
    message: string,
    public readonly grpcCode: number,
    public readonly details?: string,
  ) {
    super(message, 'GRPC_ERROR');
    this.name = 'GtSimGrpcError';
  }
}

/** Error converting OSI GroundTruth to SimulationFrame. */
export class ConversionError extends GtSimError {
  constructor(message: string) {
    super(message, 'CONVERSION_ERROR');
    this.name = 'ConversionError';
  }
}

/** Invalid state transition (e.g., stopping when not running). */
export class SimulationStateError extends GtSimError {
  constructor(message: string) {
    super(message, 'STATE_ERROR');
    this.name = 'SimulationStateError';
  }
}
