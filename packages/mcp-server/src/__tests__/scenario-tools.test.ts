import { describe, it, expect, beforeEach } from 'vitest';
import { createScenarioStore } from '@osce/scenario-engine';
import { scenarioTools } from '../tools/scenario-tools.js';
import type { ScenarioStoreInstance } from '../tools/tool-registry.js';

function callTool(name: string, args: Record<string, unknown>, store: ScenarioStoreInstance) {
  const tool = scenarioTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool.handler(args, store);
}

describe('scenario-tools', () => {
  let store: ScenarioStoreInstance;

  beforeEach(() => {
    store = createScenarioStore();
  });

  describe('create_scenario', () => {
    it('should create an empty scenario', () => {
      const result = callTool('create_scenario', {}, store);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('documentId');
      const doc = store.getState().getScenario();
      expect(doc.entities).toHaveLength(0);
    });

    it('should reset state when called again', () => {
      store.getState().addEntity({ name: 'Ego', type: 'vehicle' });
      expect(store.getState().getScenario().entities).toHaveLength(1);

      const result = callTool('create_scenario', {}, store);
      expect(result.success).toBe(true);
      expect(store.getState().getScenario().entities).toHaveLength(0);
    });
  });

  describe('get_scenario_state', () => {
    it('should return scenario state and document', () => {
      store.getState().createScenario();
      store.getState().addEntity({ name: 'Ego', type: 'vehicle' });

      const result = callTool('get_scenario_state', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data).toHaveProperty('state');
      expect(data).toHaveProperty('document');
      const state = data['state'] as Record<string, unknown>;
      expect(state['entityCount']).toBe(1);
    });
  });

  describe('export_xosc', () => {
    it('should export XML', () => {
      store.getState().createScenario();
      const result = callTool('export_xosc', {}, store);
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
      expect(result.data as string).toContain('OpenSCENARIO');
    });

    it('should export formatted XML by default', () => {
      store.getState().createScenario();
      const result = callTool('export_xosc', { formatted: true }, store);
      expect(result.success).toBe(true);
      expect((result.data as string).includes('\n')).toBe(true);
    });
  });

  describe('validate_scenario', () => {
    it('should return validation result', () => {
      store.getState().createScenario();
      const result = callTool('validate_scenario', {}, store);
      expect(result.success).toBe(true);
      const data = result.data as Record<string, unknown>;
      expect(data).toHaveProperty('valid');
      expect(data).toHaveProperty('errors');
      expect(data).toHaveProperty('warnings');
    });
  });

  describe('import_xosc', () => {
    it('should reject missing xml parameter', () => {
      const result = callTool('import_xosc', {}, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('xml');
    });

    it('should reject invalid XML', () => {
      const result = callTool('import_xosc', { xml: 'not xml' }, store);
      expect(result.success).toBe(false);
    });

    // Minimal fixture that exercises all sections lost by the old piecemeal approach.
    // Uses CatalogReference for entities (same pattern as esmini demo files) to avoid
    // having to specify full Vehicle XML which has many required attributes.
    const FIXTURE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2024-01-01T00:00:00"
              description="MCP import round-trip test" author="TestSuite"/>
  <ParameterDeclarations>
    <ParameterDeclaration name="EgoSpeed" parameterType="double" value="30.0"/>
  </ParameterDeclarations>
  <CatalogLocations>
    <VehicleCatalog>
      <Directory path="../xosc/Catalogs/Vehicles"/>
    </VehicleCatalog>
  </CatalogLocations>
  <RoadNetwork>
    <LogicFile filepath="../xodr/straight_500m.xodr"/>
  </RoadNetwork>
  <Entities>
    <ScenarioObject name="Ego">
      <CatalogReference catalogName="VehicleCatalog" entryName="car_white"/>
    </ScenarioObject>
    <ScenarioObject name="Target">
      <CatalogReference catalogName="VehicleCatalog" entryName="car_red"/>
    </ScenarioObject>
  </Entities>
  <Storyboard>
    <Init>
      <Actions>
        <Private entityRef="Ego">
          <PrivateAction>
            <TeleportAction>
              <Position>
                <LanePosition roadId="1" laneId="-1" offset="0" s="50"/>
              </Position>
            </TeleportAction>
          </PrivateAction>
        </Private>
      </Actions>
    </Init>
    <Story name="TestStory">
      <Act name="TestAct">
        <ManeuverGroup maximumExecutionCount="1" name="TestGroup">
          <Actors selectTriggeringEntities="false">
            <EntityRef entityRef="Ego"/>
          </Actors>
          <Maneuver name="TestManeuver">
            <Event name="TestEvent" priority="overwrite">
              <Action name="TestAction">
                <PrivateAction>
                  <LongitudinalAction>
                    <SpeedAction>
                      <SpeedActionDynamics dynamicsShape="linear" dynamicsDimension="time" value="2.0"/>
                      <SpeedActionTarget>
                        <AbsoluteTargetSpeed value="20"/>
                      </SpeedActionTarget>
                    </SpeedAction>
                  </LongitudinalAction>
                </PrivateAction>
              </Action>
              <StartTrigger>
                <ConditionGroup>
                  <Condition name="StartCond" delay="0" conditionEdge="rising">
                    <ByValueCondition>
                      <SimulationTimeCondition value="1" rule="greaterThan"/>
                    </ByValueCondition>
                  </Condition>
                </ConditionGroup>
              </StartTrigger>
            </Event>
          </Maneuver>
        </ManeuverGroup>
        <StartTrigger>
          <ConditionGroup>
            <Condition name="ActStart" delay="0" conditionEdge="rising">
              <ByValueCondition>
                <SimulationTimeCondition value="0" rule="greaterThan"/>
              </ByValueCondition>
            </Condition>
          </ConditionGroup>
        </StartTrigger>
      </Act>
    </Story>
    <StopTrigger>
      <ConditionGroup>
        <Condition conditionEdge="none" delay="0" name="StopCond">
          <ByValueCondition>
            <SimulationTimeCondition rule="greaterThan" value="10"/>
          </ByValueCondition>
        </Condition>
      </ConditionGroup>
    </StopTrigger>
  </Storyboard>
</OpenSCENARIO>`;

    it('should load document verbatim (preserving all sections)', () => {
      const result = callTool('import_xosc', { xml: FIXTURE_XML }, store);
      expect(result.success).toBe(true);

      const doc = store.getState().getScenario();

      // fileHeader must survive
      expect(doc.fileHeader.description).toBe('MCP import round-trip test');
      expect(doc.fileHeader.author).toBe('TestSuite');

      // roadNetwork.logicFile must survive
      expect(doc.roadNetwork.logicFile).toBeTruthy();

      // parameterDeclarations must survive
      expect(doc.parameterDeclarations.length).toBeGreaterThan(0);
      expect(doc.parameterDeclarations.some((p) => p.name === 'EgoSpeed')).toBe(true);

      // storyboard stopTrigger must survive
      expect(doc.storyboard.stopTrigger).toBeDefined();
      expect(doc.storyboard.stopTrigger.conditionGroups.length).toBeGreaterThan(0);

      // entities and stories must be intact (fixture has 2 entities: Ego and Target)
      expect(doc.entities).toHaveLength(2);
      expect(doc.entities[0].name).toBe('Ego');
      expect(doc.storyboard.stories).toHaveLength(1);
    });

    it('should clear command history so undo is not available after import', () => {
      // Perform an undoable operation first
      store.getState().addEntity({ name: 'Throwaway', type: 'vehicle' });
      expect(store.getState().undoAvailable).toBe(true);

      // Import replaces the document and must clear history
      callTool('import_xosc', { xml: FIXTURE_XML }, store);
      expect(store.getState().undoAvailable).toBe(false);
    });

    it('should error message reference v1.3.1 not v1.2', () => {
      const result = callTool('import_xosc', { xml: 'bad xml' }, store);
      expect(result.success).toBe(false);
      expect(result.error).toContain('v1.3.1');
      expect(result.error).not.toContain('v1.2');
    });
  });
});
