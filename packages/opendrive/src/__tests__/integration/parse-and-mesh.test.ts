import { describe, it, expect } from 'vitest';
import { XodrParser } from '../../parser/xodr-parser.js';
import { generateRoadMesh } from '../../mesh/road-mesh-generator.js';
import { evaluateReferenceLineAtS, evaluateGeometry } from '../../geometry/reference-line.js';
import { evaluateElevation } from '../../geometry/elevation.js';

const parser = new XodrParser();

const MULTI_GEOMETRY_XML = `<?xml version="1.0" standalone="yes"?>
<OpenDRIVE>
  <header revMajor="1" revMinor="6" name="MultiGeom" date="2024-01-01"/>
  <road name="Road1" length="230" id="1" junction="-1">
    <planView>
      <geometry s="0" x="0" y="0" hdg="0" length="100">
        <line/>
      </geometry>
      <geometry s="100" x="100" y="0" hdg="0" length="30">
        <spiral curvStart="0" curvEnd="0.0133"/>
      </geometry>
      <geometry s="130" x="129.87" y="2.65" hdg="0.1995" length="50">
        <arc curvature="0.0133"/>
      </geometry>
      <geometry s="180" x="172.43" y="22.38" hdg="0.865" length="50">
        <paramPoly3 aU="0" bU="1" cU="0" dU="0" aV="0" bV="0" cV="0.0001" dV="0" pRange="arcLength"/>
      </geometry>
    </planView>
    <elevationProfile>
      <elevation s="0" a="0" b="0.01" c="0" d="0"/>
      <elevation s="100" a="1" b="0" c="0" d="0"/>
    </elevationProfile>
    <lateralProfile/>
    <lanes>
      <laneSection s="0">
        <left>
          <lane id="2" type="shoulder" level="false">
            <width sOffset="0" a="1.5" b="0" c="0" d="0"/>
          </lane>
          <lane id="1" type="driving" level="false">
            <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
            <roadMark sOffset="0" type="solid" color="white" width="0.15"/>
          </lane>
        </left>
        <center>
          <lane id="0" type="driving" level="false">
            <roadMark sOffset="0" type="broken" color="standard" width="0.12"/>
          </lane>
        </center>
        <right>
          <lane id="-1" type="driving" level="false">
            <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
            <roadMark sOffset="0" type="solid" color="white" width="0.15"/>
          </lane>
          <lane id="-2" type="shoulder" level="false">
            <width sOffset="0" a="1.5" b="0" c="0" d="0"/>
          </lane>
        </right>
      </laneSection>
    </lanes>
  </road>
</OpenDRIVE>`;

describe('Integration: parse and generate mesh', () => {
  it('should parse multi-geometry road and generate meshes', () => {
    const doc = parser.parse(MULTI_GEOMETRY_XML);
    expect(doc.roads).toHaveLength(1);

    const road = doc.roads[0];
    expect(road.planView).toHaveLength(4);
    expect(road.planView[0].type).toBe('line');
    expect(road.planView[1].type).toBe('spiral');
    expect(road.planView[2].type).toBe('arc');
    expect(road.planView[3].type).toBe('paramPoly3');

    const mesh = generateRoadMesh(road, { baseStep: 2.0 });
    expect(mesh.roadId).toBe('1');
    expect(mesh.laneSections).toHaveLength(1);

    // 4 lanes with width (2 left + 2 right, center has no width)
    expect(mesh.laneSections[0].lanes).toHaveLength(4);

    // Verify no NaN in vertices
    for (const lane of mesh.laneSections[0].lanes) {
      for (let i = 0; i < lane.vertices.length; i++) {
        expect(Number.isNaN(lane.vertices[i])).toBe(false);
      }
    }
  });

  it('should maintain geometry continuity at line-spiral boundary', () => {
    const doc = parser.parse(MULTI_GEOMETRY_XML);
    const road = doc.roads[0];
    const planView = road.planView;

    // Check line → spiral boundary (exact coordinates in XML: 100, 0)
    const lineEnd = evaluateGeometry(planView[0].length, planView[0]);
    expect(Math.abs(lineEnd.x - planView[1].x)).toBeLessThan(0.01);
    expect(Math.abs(lineEnd.y - planView[1].y)).toBeLessThan(0.01);
  });

  it('should compute consistent geometry for programmatic coordinates', () => {
    // Build a road where geometry segment starts use computed end-of-previous
    const geom0 = { s: 0, x: 0, y: 0, hdg: 0, length: 50, type: 'line' as const };
    const end0 = evaluateGeometry(geom0.length, geom0);

    const geom1 = {
      s: 50, x: end0.x, y: end0.y, hdg: end0.hdg, length: 50,
      type: 'arc' as const, curvature: 0.02,
    };
    const end1 = evaluateGeometry(geom1.length, geom1);

    // Verify continuity with exact computed coordinates
    const p_at_50 = evaluateReferenceLineAtS([geom0, geom1], 50);
    expect(p_at_50.x).toBeCloseTo(end0.x, 4);
    expect(p_at_50.y).toBeCloseTo(end0.y, 4);

    // Verify arc endpoint heading
    expect(end1.hdg).toBeCloseTo(0 + 0.02 * 50, 4); // hdg = hdg0 + k*ds = 0 + 1.0
  });

  it('should apply elevation profile', () => {
    const doc = parser.parse(MULTI_GEOMETRY_XML);
    const road = doc.roads[0];
    const mesh = generateRoadMesh(road, { baseStep: 5.0 });

    // Check that z-values vary along the road
    const lane = mesh.laneSections[0].lanes[0];
    expect(lane.vertices.length).toBeGreaterThan(6);

    // First part has b=0.01 slope, so z should increase from 0
    const firstZ = lane.vertices[2]; // z of first vertex
    // Find a vertex further along the road
    const laterIdx = Math.min(20 * 2 * 3 + 2, lane.vertices.length - 1);
    const laterZ = lane.vertices[laterIdx];
    expect(laterZ).toBeGreaterThanOrEqual(firstZ);
  });

  it('should handle elevation transition', () => {
    const doc = parser.parse(MULTI_GEOMETRY_XML);
    const road = doc.roads[0];

    // At s=0, z = 0 + 0.01*0 = 0
    // At s=50, z = 0 + 0.01*50 = 0.5
    // At s=100, z = 0 + 0.01*100 = 1.0
    // At s=150, z = 1 + 0*50 = 1.0 (second elevation record)
    expect(evaluateElevation(road.elevationProfile, 0)).toBeCloseTo(0);
    expect(evaluateElevation(road.elevationProfile, 50)).toBeCloseTo(0.5);
    expect(evaluateElevation(road.elevationProfile, 100)).toBeCloseTo(1.0);
    expect(evaluateElevation(road.elevationProfile, 150)).toBeCloseTo(1.0);
  });
});

describe('Integration: minimal road', () => {
  it('should handle minimal road with only center lane', () => {
    const xml = `<OpenDRIVE>
      <header revMajor="1" revMinor="6" name="" date=""/>
      <road name="minimal" length="50" id="1" junction="-1">
        <planView>
          <geometry s="0" x="0" y="0" hdg="0" length="50"><line/></geometry>
        </planView>
        <lanes>
          <laneSection s="0">
            <center><lane id="0" type="none"/></center>
          </laneSection>
        </lanes>
      </road>
    </OpenDRIVE>`;
    const doc = parser.parse(xml);
    const mesh = generateRoadMesh(doc.roads[0]);
    expect(mesh.laneSections[0].lanes).toHaveLength(0);
  });

  it('should handle multiple lane sections', () => {
    const xml = `<OpenDRIVE>
      <header revMajor="1" revMinor="6" name="" date=""/>
      <road name="twoSections" length="200" id="1" junction="-1">
        <planView>
          <geometry s="0" x="0" y="0" hdg="0" length="200"><line/></geometry>
        </planView>
        <lanes>
          <laneSection s="0">
            <center><lane id="0" type="none"/></center>
            <right>
              <lane id="-1" type="driving">
                <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
              </lane>
            </right>
          </laneSection>
          <laneSection s="100">
            <center><lane id="0" type="none"/></center>
            <right>
              <lane id="-1" type="driving">
                <width sOffset="0" a="3.5" b="0" c="0" d="0"/>
              </lane>
              <lane id="-2" type="shoulder">
                <width sOffset="0" a="2.0" b="0" c="0" d="0"/>
              </lane>
            </right>
          </laneSection>
        </lanes>
      </road>
    </OpenDRIVE>`;
    const doc = parser.parse(xml);
    const mesh = generateRoadMesh(doc.roads[0]);
    expect(mesh.laneSections).toHaveLength(2);
    expect(mesh.laneSections[0].lanes).toHaveLength(1);
    expect(mesh.laneSections[1].lanes).toHaveLength(2);
    expect(mesh.laneSections[0].sStart).toBe(0);
    expect(mesh.laneSections[0].sEnd).toBe(100);
    expect(mesh.laneSections[1].sStart).toBe(100);
    expect(mesh.laneSections[1].sEnd).toBe(200);
  });
});
