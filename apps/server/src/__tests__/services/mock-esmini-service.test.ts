import { describe, it, expect, afterEach } from 'vitest';
import { MockEsminiService } from '../../services/mock-esmini-service.js';

describe('MockEsminiService', () => {
  let service: MockEsminiService;

  afterEach(async () => {
    if (service) {
      await service.stopSimulation();
    }
  });

  it('should start with idle status', () => {
    service = new MockEsminiService();
    expect(service.getStatus()).toBe('idle');
    expect(service.getResult()).toBeNull();
  });

  it('should transition to running on start', async () => {
    service = new MockEsminiService();
    await service.startSimulation({ scenarioXml: '<xml/>', duration: 1 });
    expect(service.getStatus()).toBe('running');
  });

  it('should emit frames during simulation', async () => {
    service = new MockEsminiService();
    const frames: unknown[] = [];
    service.onFrame((frame) => frames.push(frame));

    await service.startSimulation({ scenarioXml: '<xml/>', duration: 1 });

    // Wait for a few frames
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(frames.length).toBeGreaterThan(0);
    expect(frames[0]).toHaveProperty('time');
    expect(frames[0]).toHaveProperty('objects');
  });

  it('should stop simulation', async () => {
    service = new MockEsminiService();
    await service.startSimulation({ scenarioXml: '<xml/>', duration: 10 });
    await service.stopSimulation();

    expect(service.getStatus()).toBe('completed');
    expect(service.getResult()).not.toBeNull();
  });

  it('should allow unsubscribing from frame callbacks', async () => {
    service = new MockEsminiService();
    const frames: unknown[] = [];
    const unsub = service.onFrame((frame) => frames.push(frame));
    unsub();

    await service.startSimulation({ scenarioXml: '<xml/>', duration: 1 });
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(frames.length).toBe(0);
  });

  it('should complete when duration is reached', async () => {
    service = new MockEsminiService();
    let completed = false;
    service.onComplete(() => {
      completed = true;
    });

    await service.startSimulation({
      scenarioXml: '<xml/>',
      duration: 0.3,
      config: { fixedTimestep: 0.1, executablePath: '', headless: true },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(completed).toBe(true);
    expect(service.getStatus()).toBe('completed');
  });
});
