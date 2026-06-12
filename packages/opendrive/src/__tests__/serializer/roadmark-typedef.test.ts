import { describe, it, expect } from 'vitest';
import { XodrParser } from '../../parser/xodr-parser.js';
import { XodrSerializer } from '../../serializer/xodr-serializer.js';

const parser = new XodrParser();
const serializer = new XodrSerializer();

/**
 * A roadMark whose `type` attribute (e.g. "solid solid") and `<type>` child
 * element (detailed line definitions) share the name "type". The parser must
 * keep both: the attribute on `roadMark.type` and the child on
 * `roadMark.typeDef`. This regression guards the attribute/element collision
 * that previously dropped the `<type>` child on load.
 */
const ROADMARK_TYPEDEF_XML = `<?xml version="1.0" standalone="yes"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="6" name="TypeDef" date="2024-01-01"/>
  <road name="r" length="100" id="1" junction="-1">
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="100"><line/></geometry>
    </planView>
    <lanes>
      <laneSection s="0">
        <center>
          <lane id="0" type="none">
            <roadMark sOffset="0" type="solid solid" weight="standard" color="white" width="0.3">
              <type name="solid solid" width="0.3">
                <line length="3" space="0" tOffset="0.1" sOffset="0" rule="no passing" width="0.15" color="white"/>
                <line length="3" space="0" tOffset="-0.1" sOffset="0" rule="no passing" width="0.15" color="white"/>
              </type>
            </roadMark>
          </lane>
        </center>
      </laneSection>
    </lanes>
  </road>
</OpenDRIVE>`;

describe('roadMark <type> child (typeDef) round-trip', () => {
  it('parses both the type attribute and the <type> child element', () => {
    const doc = parser.parse(ROADMARK_TYPEDEF_XML);
    const rm = doc.roads[0].lanes[0].centerLane.roadMarks[0];

    // The `type` attribute survives independently of the child element.
    expect(rm.type).toBe('solid solid');

    // The `<type>` child (typeDef) must be present with its two lines.
    expect(rm.typeDef).toBeDefined();
    expect(rm.typeDef!.name).toBe('solid solid');
    expect(rm.typeDef!.width).toBeCloseTo(0.3, 6);
    expect(rm.typeDef!.lines).toHaveLength(2);

    const [l0, l1] = rm.typeDef!.lines;
    expect(l0.length).toBeCloseTo(3, 6);
    expect(l0.tOffset).toBeCloseTo(0.1, 6);
    expect(l0.rule).toBe('no passing');
    expect(l0.width).toBeCloseTo(0.15, 6);
    expect(l0.color).toBe('white');
    expect(l1.tOffset).toBeCloseTo(-0.1, 6);
  });

  it('preserves the <type> child through serialize -> parse', () => {
    const doc = parser.parse(ROADMARK_TYPEDEF_XML);
    const serialized = serializer.serializeFormatted(doc);

    // The serialized XML must contain a <type> child with <line> entries.
    expect(serialized).toContain('<type ');
    expect(serialized).toContain('<line ');

    const reparsed = parser.parse(serialized);
    const reRm = reparsed.roads[0].lanes[0].centerLane.roadMarks[0];

    expect(reRm.type).toBe('solid solid');
    expect(reRm.typeDef).toBeDefined();
    expect(reRm.typeDef).toEqual(doc.roads[0].lanes[0].centerLane.roadMarks[0].typeDef);
    expect(reRm.typeDef!.lines).toHaveLength(2);
  });
});
