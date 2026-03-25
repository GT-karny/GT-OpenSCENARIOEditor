import { describe, it, expect } from 'vitest';
import { XoscParser } from '../parser/xosc-parser.js';
import { XoscSerializer } from '../serializer/xosc-serializer.js';

const parser = new XoscParser();
const serializer = new XoscSerializer();

/**
 * Minimal .xosc with expression attributes in Init SpeedAction.
 * Binding collection is active for Init private actions (setBindingElementId is called),
 * so ${expr} values in this scope are captured in parameterBindings.
 */
const XOSC_WITH_EXPRESSION = `<?xml version="1.0" encoding="utf-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="3" date="2024-01-01T00:00:00" description="Expression test" author="test"/>
  <ParameterDeclarations>
    <ParameterDeclaration name="EgoSpeed" parameterType="double" value="30"/>
  </ParameterDeclarations>
  <CatalogLocations/>
  <RoadNetwork>
    <LogicFile filepath=""/>
  </RoadNetwork>
  <Entities>
    <ScenarioObject name="Ego">
      <Vehicle name="car" vehicleCategory="car">
        <Performance maxSpeed="70" maxAcceleration="5" maxDeceleration="10"/>
        <BoundingBox>
          <Center x="1.5" y="0" z="0.9"/>
          <Dimensions width="2.1" length="4.5" height="1.8"/>
        </BoundingBox>
        <Axles>
          <FrontAxle maxSteering="0.5" wheelDiameter="0.6" trackWidth="1.8" positionX="3.1" positionZ="0.3"/>
          <RearAxle maxSteering="0" wheelDiameter="0.6" trackWidth="1.8" positionX="0" positionZ="0.3"/>
        </Axles>
      </Vehicle>
    </ScenarioObject>
  </Entities>
  <Storyboard>
    <Init>
      <Actions>
        <Private entityRef="Ego">
          <PrivateAction>
            <LongitudinalAction>
              <SpeedAction>
                <SpeedActionDynamics dynamicsShape="step" value="0" dynamicsDimension="time"/>
                <SpeedActionTarget>
                  <AbsoluteTargetSpeed value="\${$EgoSpeed / 3.6}"/>
                </SpeedActionTarget>
              </SpeedAction>
            </LongitudinalAction>
          </PrivateAction>
        </Private>
      </Actions>
    </Init>
    <StopTrigger/>
  </Storyboard>
</OpenSCENARIO>`;

describe('Expression round-trip', () => {
  it('preserves ${expr} in numeric attributes through parse → serialize → parse', () => {
    // Parse
    const doc1 = parser.parse(XOSC_WITH_EXPRESSION);

    // Verify expression is captured in parameterBindings
    const bindings1 = doc1._editor.parameterBindings;
    const allBindingValues = Object.values(bindings1).flatMap((b) => Object.values(b));
    expect(allBindingValues).toContain('${$EgoSpeed / 3.6}');

    // Serialize
    const xml = serializer.serializeFormatted(doc1);

    // Verify expression appears in output XML
    expect(xml).toContain('value="${$EgoSpeed / 3.6}"');

    // Re-parse
    const doc2 = parser.parse(xml);
    const bindings2 = doc2._editor.parameterBindings;
    const allBindingValues2 = Object.values(bindings2).flatMap((b) => Object.values(b));
    expect(allBindingValues2).toContain('${$EgoSpeed / 3.6}');
  });

  it('preserves $param references alongside ${expr} in the same document', () => {
    // Use $param (not ${expr}) for the target speed
    const xosc = XOSC_WITH_EXPRESSION.replace(
      'value="${$EgoSpeed / 3.6}"',
      'value="$EgoSpeed"',
    );

    const doc = parser.parse(xosc);
    const bindings = doc._editor.parameterBindings;
    const allValues = Object.values(bindings).flatMap((b) => Object.values(b));

    expect(allValues).toContain('$EgoSpeed');

    // Serialize and verify
    const xml = serializer.serializeFormatted(doc);
    expect(xml).toContain('value="$EgoSpeed"');
  });

  it('internal value defaults to 0 when expression is bound', () => {
    const doc = parser.parse(XOSC_WITH_EXPRESSION);

    // The init action's SpeedAction target should have numeric value 0 (default)
    const initAction = doc.storyboard.init.entityActions[0]?.privateActions[0];
    expect(initAction).toBeDefined();
    if (initAction?.type === 'speedAction') {
      if (initAction.target.kind === 'absolute') {
        expect(initAction.target.value).toBe(0);
      }
    }
  });
});
