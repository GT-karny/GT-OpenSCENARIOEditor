import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { SimulationFrame } from '@osce/shared';
import type { GtSimConfig } from './types.js';
import { convertGroundTruth } from '../converter/ground-truth-converter.js';
import { GtSimGrpcError } from '../errors.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type FrameCallback = (frame: SimulationFrame) => void;
export type ErrorCallback = (error: Error) => void;
export type EndCallback = () => void;

/** Lazy-loaded service constructor. */
let GroundTruthServiceClient: grpc.ServiceClientConstructor | null = null;

function getServiceClient(): grpc.ServiceClientConstructor {
  if (GroundTruthServiceClient) return GroundTruthServiceClient;

  const protoDir = resolve(__dirname, '../../proto');
  const osiDir = resolve(__dirname, '../../../../Thirdparty/open-simulation-interface');

  const packageDefinition = protoLoader.loadSync('service_groundtruth.proto', {
    keepCase: false,
    longs: Number,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [protoDir, osiDir],
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const osiServer = (proto.osi as any).server;
  GroundTruthServiceClient = osiServer.GroundTruthService as grpc.ServiceClientConstructor;
  return GroundTruthServiceClient;
}

/**
 * gRPC client for GT_Sim GroundTruthService.
 * Streams osi3.GroundTruth messages and converts them to SimulationFrame.
 */
export class GtSimGrpcClient {
  private client: grpc.Client | null = null;

  constructor(private readonly config: GtSimConfig) {}

  /**
   * Start streaming GroundTruth from the currently running simulation.
   * Each received GroundTruth message is converted to SimulationFrame.
   * Returns a cancel function to stop the stream.
   */
  startStream(
    onFrame: FrameCallback,
    onError: ErrorCallback,
    onEnd: EndCallback,
  ): () => void {
    const ServiceClient = getServiceClient();
    this.client = new ServiceClient(
      this.config.grpcHost,
      grpc.credentials.createInsecure(),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = this.client as any;
    const stream = client.StreamGroundTruth({}) as grpc.ClientReadableStream<unknown>;

    stream.on('data', (message: unknown) => {
      try {
        const frame = convertGroundTruth(message as Record<string, unknown>);
        onFrame(frame);
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    });

    stream.on('error', (err: grpc.ServiceError) => {
      // Status CANCELLED is expected when we cancel the stream
      if (err.code === grpc.status.CANCELLED) return;

      onError(
        new GtSimGrpcError(
          `gRPC stream error: ${err.message}`,
          err.code ?? grpc.status.UNKNOWN,
          err.details,
        ),
      );
    });

    stream.on('end', () => {
      onEnd();
    });

    return () => {
      stream.cancel();
    };
  }

  /** Close the gRPC channel. */
  close(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}
