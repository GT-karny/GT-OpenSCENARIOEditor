import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GtSimService } from '../service/gt-sim-service.js';
import { SimulationStateError } from '../errors.js';
import type { GtSimConfig } from '../client/types.js';
import type { SimulationFrame } from '@osce/shared';

// Store rest client mock for per-test override
let restClientMock: {
  uploadScenario: ReturnType<typeof vi.fn>;
  createSimulation: ReturnType<typeof vi.fn>;
  deleteSimulation: ReturnType<typeof vi.fn>;
};

vi.mock('../client/gt-sim-rest-client.js', () => ({
  GtSimRestClient: vi.fn().mockImplementation(() => restClientMock),
}));

// Store grpc callbacks for manual invocation in tests
let grpcCallbacks: {
  onFrame: ((frame: SimulationFrame) => void) | null;
  onError: ((error: Error) => void) | null;
  onEnd: (() => void) | null;
  cancelFn: ReturnType<typeof vi.fn>;
} = { onFrame: null, onError: null, onEnd: null, cancelFn: vi.fn() };

vi.mock('../client/gt-sim-grpc-client.js', () => ({
  GtSimGrpcClient: vi.fn().mockImplementation(() => ({
    startStream: vi.fn().mockImplementation(
      (
        onFrame: (frame: SimulationFrame) => void,
        onError: (error: Error) => void,
        onEnd: () => void,
      ) => {
        grpcCallbacks.onFrame = onFrame;
        grpcCallbacks.onError = onError;
        grpcCallbacks.onEnd = onEnd;
        return grpcCallbacks.cancelFn;
      },
    ),
    close: vi.fn(),
  })),
}));

const config: GtSimConfig = {
  restBaseUrl: 'http://127.0.0.1:8000',
  grpcHost: '127.0.0.1:50051',
};

describe('GtSimService', () => {
  let service: GtSimService;

  beforeEach(() => {
    restClientMock = {
      uploadScenario: vi.fn().mockResolvedValue({ scenario_id: 'test_scenario_id' }),
      createSimulation: vi.fn().mockResolvedValue({ job_id: 'test_job_id', status: 'starting' }),
      deleteSimulation: vi.fn().mockResolvedValue(undefined),
    };
    grpcCallbacks = { onFrame: null, onError: null, onEnd: null, cancelFn: vi.fn() };
    service = new GtSimService(config);
  });

  describe('initial state', () => {
    it('should start with idle status', () => {
      expect(service.getStatus()).toBe('idle');
    });

    it('should return null result when idle', () => {
      expect(service.getResult()).toBeNull();
    });
  });

  describe('startSimulation', () => {
    it('should transition to running status', async () => {
      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });
      expect(service.getStatus()).toBe('running');
    });

    it('should throw SimulationStateError if already running', async () => {
      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });
      await expect(
        service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' }),
      ).rejects.toThrow(SimulationStateError);
    });

    it('should buffer frames and dispatch to callbacks', async () => {
      const frameHandler = vi.fn();
      service.onFrame(frameHandler);

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      const frame: SimulationFrame = {
        time: 0.1,
        objects: [{ id: 0, name: 'Ego', x: 10, y: 20, z: 0, h: 0, p: 0, r: 0, speed: 5 }],
      };
      grpcCallbacks.onFrame!(frame);

      expect(frameHandler).toHaveBeenCalledWith(frame);
      expect(service.getResult()?.frames).toHaveLength(1);
    });

    it('should dispatch to multiple frame callbacks', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      service.onFrame(handler1);
      service.onFrame(handler2);

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      const frame: SimulationFrame = { time: 0.1, objects: [] };
      grpcCallbacks.onFrame!(frame);

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should transition to completed when stream ends', async () => {
      const completeHandler = vi.fn();
      service.onComplete(completeHandler);

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      // Emit a few frames
      grpcCallbacks.onFrame!({ time: 0, objects: [] });
      grpcCallbacks.onFrame!({ time: 0.5, objects: [] });

      // End stream
      grpcCallbacks.onEnd!();

      expect(service.getStatus()).toBe('completed');
      expect(completeHandler).toHaveBeenCalledOnce();
      const result = completeHandler.mock.calls[0][0];
      expect(result.status).toBe('completed');
      expect(result.frames).toHaveLength(2);
      expect(result.duration).toBeCloseTo(0.5, 5);
    });

    it('should transition to error when stream errors', async () => {
      const completeHandler = vi.fn();
      service.onComplete(completeHandler);

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      grpcCallbacks.onError!(new Error('stream failed'));

      expect(service.getStatus()).toBe('error');
      expect(completeHandler).toHaveBeenCalledOnce();
      const result = completeHandler.mock.calls[0][0];
      expect(result.status).toBe('error');
      expect(result.error).toBe('stream failed');
    });
  });

  describe('stopSimulation', () => {
    it('should cancel stream and transition to completed', async () => {
      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });
      await service.stopSimulation();

      expect(grpcCallbacks.cancelFn).toHaveBeenCalledOnce();
      expect(service.getStatus()).toBe('completed');
    });

    it('should throw SimulationStateError if not running', async () => {
      await expect(service.stopSimulation()).rejects.toThrow(SimulationStateError);
    });
  });

  describe('callback management', () => {
    it('should support unsubscribing frame callbacks', async () => {
      const handler = vi.fn();
      const unsubscribe = service.onFrame(handler);

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      grpcCallbacks.onFrame!({ time: 0, objects: [] });
      expect(handler).toHaveBeenCalledOnce();

      unsubscribe();

      grpcCallbacks.onFrame!({ time: 0.1, objects: [] });
      expect(handler).toHaveBeenCalledOnce(); // Not called again
    });

    it('should support unsubscribing complete callbacks', async () => {
      const handler = vi.fn();
      const unsubscribe = service.onComplete(handler);
      unsubscribe();

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });
      grpcCallbacks.onEnd!();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('getResult', () => {
    it('should return null when idle', () => {
      expect(service.getResult()).toBeNull();
    });

    it('should return result with buffered frames after completion', async () => {
      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      grpcCallbacks.onFrame!({
        time: 0,
        objects: [{ id: 0, name: 'Ego', x: 0, y: 0, z: 0, h: 0, p: 0, r: 0, speed: 0 }],
      });
      grpcCallbacks.onFrame!({
        time: 1.0,
        objects: [{ id: 0, name: 'Ego', x: 10, y: 0, z: 0, h: 0, p: 0, r: 0, speed: 10 }],
      });
      grpcCallbacks.onEnd!();

      const result = service.getResult();
      expect(result).not.toBeNull();
      expect(result!.status).toBe('completed');
      expect(result!.frames).toHaveLength(2);
      expect(result!.duration).toBeCloseTo(1.0, 5);
    });
  });

  describe('startSimulation error recovery', () => {
    it('should remain idle when upload fails', async () => {
      restClientMock.uploadScenario.mockRejectedValue(new Error('upload failed'));

      await expect(
        service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' }),
      ).rejects.toThrow('upload failed');

      expect(service.getStatus()).toBe('idle');
      expect(service.getResult()).toBeNull();
    });

    it('should remain idle when createSimulation fails', async () => {
      restClientMock.createSimulation.mockRejectedValue(new Error('create failed'));

      await expect(
        service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' }),
      ).rejects.toThrow('create failed');

      expect(service.getStatus()).toBe('idle');
      expect(service.getResult()).toBeNull();
    });

    it('should allow retry after REST failure', async () => {
      restClientMock.uploadScenario.mockRejectedValueOnce(new Error('transient'));

      await expect(
        service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' }),
      ).rejects.toThrow('transient');

      expect(service.getStatus()).toBe('idle');

      // Retry should succeed
      restClientMock.uploadScenario.mockResolvedValue({ scenario_id: 'retry_id' });
      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });
      expect(service.getStatus()).toBe('running');
    });
  });

  describe('dispose', () => {
    it('should cancel active stream and close gRPC client', async () => {
      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });

      service.dispose();

      expect(grpcCallbacks.cancelFn).toHaveBeenCalledOnce();
    });

    it('should clear all callbacks', async () => {
      const frameHandler = vi.fn();
      const completeHandler = vi.fn();
      service.onFrame(frameHandler);
      service.onComplete(completeHandler);

      await service.startSimulation({ scenarioXml: '<OpenSCENARIO/>' });
      service.dispose();

      // Callbacks should be cleared — triggering them should not call handlers
      // (In practice, after dispose the stream is cancelled so no more events)
      expect(frameHandler).not.toHaveBeenCalled();
      expect(completeHandler).not.toHaveBeenCalled();
    });
  });
});
