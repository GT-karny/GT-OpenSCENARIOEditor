import { test, expect } from '@playwright/test';

test.describe('GT_Sim Scenario Upload', () => {
  test.skip(!process.env.USE_GT_SIM, 'GT_Sim not available');

  test('should upload custom XOSC and run simulation', async ({ request }) => {
    const minimalXosc = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="2" date="2024-01-01" description="Test" author="E2E"/>
  <ParameterDeclarations/>
  <CatalogLocations/>
  <RoadNetwork>
    <LogicFile filepath="straight_500m.xodr"/>
  </RoadNetwork>
  <Entities>
    <ScenarioObject name="Ego">
      <Vehicle name="Ego" vehicleCategory="car">
        <BoundingBox>
          <Center x="1.4" y="0" z="0.9"/>
          <Dimensions width="2.0" length="4.5" height="1.8"/>
        </BoundingBox>
        <Performance maxSpeed="69.444" maxAcceleration="200" maxDeceleration="10"/>
        <Axles>
          <FrontAxle maxSteering="0.5" wheelDiameter="0.6" trackWidth="1.8" positionX="3.1" positionZ="0.3"/>
          <RearAxle maxSteering="0" wheelDiameter="0.6" trackWidth="1.8" positionX="0" positionZ="0.3"/>
        </Axles>
        <Properties/>
      </Vehicle>
    </ScenarioObject>
  </Entities>
  <Storyboard>
    <Init>
      <Actions>
        <Private entityRef="Ego">
          <PrivateAction>
            <TeleportAction>
              <Position>
                <WorldPosition x="0" y="0" z="0" h="0"/>
              </Position>
            </TeleportAction>
          </PrivateAction>
          <PrivateAction>
            <LongitudinalAction>
              <SpeedAction>
                <SpeedActionDynamics dynamicsShape="step" value="0" dynamicsDimension="time"/>
                <SpeedActionTarget>
                  <AbsoluteTargetSpeed value="10"/>
                </SpeedActionTarget>
              </SpeedAction>
            </LongitudinalAction>
          </PrivateAction>
        </Private>
      </Actions>
    </Init>
    <StopTrigger>
      <ConditionGroup>
        <Condition name="stop" delay="0" conditionEdge="none">
          <ByValueCondition>
            <SimulationTimeCondition value="3" rule="greaterThan"/>
          </ByValueCondition>
        </Condition>
      </ConditionGroup>
    </StopTrigger>
  </Storyboard>
</OpenSCENARIO>`;

    // Upload scenario
    const uploadRes = await request.post(
      'http://127.0.0.1:8000/api/scenarios/upload',
      {
        headers: { 'Content-Type': 'application/xml' },
        data: minimalXosc,
      },
    );
    expect(uploadRes.ok()).toBeTruthy();
    const { scenario_id } = await uploadRes.json();
    expect(scenario_id).toMatch(/^tmp_/);

    // Run simulation
    const simRes = await request.post(
      'http://127.0.0.1:8000/api/simulations',
      {
        data: {
          scenario_id,
          headless: true,
          timeout: 15,
        },
      },
    );
    expect(simRes.ok()).toBeTruthy();
    const { job_id } = await simRes.json();

    // Poll for completion
    let status = 'running';
    for (let i = 0; i < 30 && status === 'running'; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await request.get(
        `http://127.0.0.1:8000/api/simulations/${job_id}`,
      );
      const statusBody = await statusRes.json();
      status = statusBody.status;
    }

    expect(['completed', 'failed']).toContain(status);

    // If completed, check metrics
    if (status === 'completed') {
      const metricsRes = await request.get(
        `http://127.0.0.1:8000/api/results/${job_id}/metrics`,
      );
      expect(metricsRes.ok()).toBeTruthy();
      const metrics = await metricsRes.json();
      expect(metrics).toHaveProperty('duration');
    }
  });
});
