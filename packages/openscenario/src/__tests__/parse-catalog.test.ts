import { describe, it, expect } from 'vitest';
import { parseCatalogXml } from '../parser/parse-catalog.js';
import { serializeCatalog } from '../serializer/build-catalog.js';

const VEHICLE_CATALOG_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="2" date="2024-01-01" description="Test vehicles" author="test"/>
  <Catalog name="VehicleCatalog">
    <Vehicle name="car_white" vehicleCategory="car">
      <ParameterDeclarations>
        <ParameterDeclaration name="MaxSpeed" parameterType="double" value="69.4"/>
      </ParameterDeclarations>
      <BoundingBox>
        <Center x="1.4" y="0.0" z="0.75"/>
        <Dimensions width="2.0" length="5.04" height="1.5"/>
      </BoundingBox>
      <Performance maxSpeed="69.4" maxAcceleration="5" maxDeceleration="10"/>
      <Axles>
        <FrontAxle maxSteering="0.52" wheelDiameter="0.8" trackWidth="1.68" positionX="2.98" positionZ="0.4"/>
        <RearAxle maxSteering="0.0" wheelDiameter="0.8" trackWidth="1.68" positionX="0" positionZ="0.4"/>
      </Axles>
      <Properties>
        <Property name="model_id" value="0"/>
      </Properties>
    </Vehicle>
    <Vehicle name="car_blue" vehicleCategory="car">
      <ParameterDeclarations/>
      <BoundingBox>
        <Center x="1.3" y="0.0" z="0.8"/>
        <Dimensions width="1.8" length="4.5" height="1.4"/>
      </BoundingBox>
      <Performance maxSpeed="60" maxAcceleration="4" maxDeceleration="8"/>
      <Axles>
        <FrontAxle maxSteering="0.5" wheelDiameter="0.7" trackWidth="1.6" positionX="2.8" positionZ="0.35"/>
        <RearAxle maxSteering="0.0" wheelDiameter="0.7" trackWidth="1.6" positionX="0" positionZ="0.35"/>
      </Axles>
      <Properties/>
    </Vehicle>
  </Catalog>
</OpenSCENARIO>`;

const PEDESTRIAN_CATALOG_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="2" date="2024-01-01" description="Test pedestrians" author="test"/>
  <Catalog name="PedestrianCatalog">
    <Pedestrian mass="80" model="EPTa" name="pedestrian_adult" pedestrianCategory="pedestrian">
      <ParameterDeclarations/>
      <BoundingBox>
        <Center x="0.06" y="0.0" z="0.923"/>
        <Dimensions height="1.8" length="0.6" width="0.5"/>
      </BoundingBox>
      <Properties>
        <Property name="model_id" value="7"/>
      </Properties>
    </Pedestrian>
  </Catalog>
</OpenSCENARIO>`;

const MISC_OBJECT_CATALOG_XML = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="2" date="2024-01-01" description="Test objects" author="test"/>
  <Catalog name="MiscObjectCatalog">
    <MiscObject mass="200" name="barrier" miscObjectCategory="barrier">
      <ParameterDeclarations/>
      <BoundingBox>
        <Center x="0" y="0" z="0.5"/>
        <Dimensions width="1.0" length="2.0" height="1.0"/>
      </BoundingBox>
      <Properties/>
    </MiscObject>
  </Catalog>
</OpenSCENARIO>`;

describe('parseCatalogXml', () => {
  it('parses a VehicleCatalog with multiple entries', () => {
    const doc = parseCatalogXml(VEHICLE_CATALOG_XML);

    expect(doc.catalogName).toBe('VehicleCatalog');
    expect(doc.catalogType).toBe('vehicle');
    expect(doc.entries).toHaveLength(2);
    expect(doc.fileHeader.description).toBe('Test vehicles');

    const first = doc.entries[0];
    expect(first.catalogType).toBe('vehicle');
    expect(first.definition.kind).toBe('vehicle');
    expect(first.definition.name).toBe('car_white');
    if (first.definition.kind === 'vehicle') {
      expect(first.definition.vehicleCategory).toBe('car');
      expect(first.definition.performance.maxSpeed).toBe(69.4);
      expect(first.definition.performance.maxAcceleration).toBe(5);
      expect(first.definition.performance.maxDeceleration).toBe(10);
      expect(first.definition.boundingBox.dimensions.length).toBe(5.04);
      expect(first.definition.axles.frontAxle.positionX).toBe(2.98);
      expect(first.definition.parameterDeclarations).toHaveLength(1);
      expect(first.definition.parameterDeclarations[0].name).toBe('MaxSpeed');
      expect(first.definition.properties).toHaveLength(1);
    }

    const second = doc.entries[1];
    expect(second.definition.name).toBe('car_blue');
  });

  it('parses a PedestrianCatalog', () => {
    const doc = parseCatalogXml(PEDESTRIAN_CATALOG_XML);

    expect(doc.catalogName).toBe('PedestrianCatalog');
    expect(doc.catalogType).toBe('pedestrian');
    expect(doc.entries).toHaveLength(1);

    const entry = doc.entries[0];
    expect(entry.catalogType).toBe('pedestrian');
    if (entry.definition.kind === 'pedestrian') {
      expect(entry.definition.name).toBe('pedestrian_adult');
      expect(entry.definition.mass).toBe(80);
      expect(entry.definition.pedestrianCategory).toBe('pedestrian');
    }
  });

  it('parses a MiscObjectCatalog', () => {
    const doc = parseCatalogXml(MISC_OBJECT_CATALOG_XML);

    expect(doc.catalogName).toBe('MiscObjectCatalog');
    expect(doc.catalogType).toBe('miscObject');
    expect(doc.entries).toHaveLength(1);

    const entry = doc.entries[0];
    expect(entry.catalogType).toBe('miscObject');
    if (entry.definition.kind === 'miscObject') {
      expect(entry.definition.name).toBe('barrier');
      expect(entry.definition.mass).toBe(200);
      expect(entry.definition.miscObjectCategory).toBe('barrier');
    }
  });

  it('throws on invalid XML without <Catalog>', () => {
    const badXml = `<?xml version="1.0"?><OpenSCENARIO><FileHeader/></OpenSCENARIO>`;
    expect(() => parseCatalogXml(badXml)).toThrow('missing <Catalog>');
  });

  it('handles empty catalog gracefully', () => {
    const emptyXml = `<?xml version="1.0"?>
<OpenSCENARIO>
  <FileHeader revMajor="1" revMinor="2" date="" description="" author=""/>
  <Catalog name="EmptyCatalog"/>
</OpenSCENARIO>`;
    const doc = parseCatalogXml(emptyXml);
    expect(doc.catalogName).toBe('EmptyCatalog');
    expect(doc.entries).toHaveLength(0);
  });
});

describe('serializeCatalog', () => {
  it('produces valid XML from a parsed VehicleCatalog', () => {
    const doc = parseCatalogXml(VEHICLE_CATALOG_XML);
    const xml = serializeCatalog(doc);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<Catalog');
    expect(xml).toContain('name="VehicleCatalog"');
    expect(xml).toContain('name="car_white"');
    expect(xml).toContain('name="car_blue"');
    expect(xml).toContain('vehicleCategory="car"');
  });

  it('round-trips a VehicleCatalog: parse → serialize → parse', () => {
    const doc1 = parseCatalogXml(VEHICLE_CATALOG_XML);
    const xml = serializeCatalog(doc1);
    const doc2 = parseCatalogXml(xml);

    expect(doc2.catalogName).toBe(doc1.catalogName);
    expect(doc2.catalogType).toBe(doc1.catalogType);
    expect(doc2.entries).toHaveLength(doc1.entries.length);

    for (let i = 0; i < doc1.entries.length; i++) {
      expect(doc2.entries[i].definition.name).toBe(doc1.entries[i].definition.name);
      expect(doc2.entries[i].definition.kind).toBe(doc1.entries[i].definition.kind);
    }
  });

  it('round-trips a PedestrianCatalog', () => {
    const doc1 = parseCatalogXml(PEDESTRIAN_CATALOG_XML);
    const xml = serializeCatalog(doc1);
    const doc2 = parseCatalogXml(xml);

    expect(doc2.catalogName).toBe('PedestrianCatalog');
    expect(doc2.entries).toHaveLength(1);
    expect(doc2.entries[0].definition.name).toBe('pedestrian_adult');
  });

  it('round-trips a MiscObjectCatalog', () => {
    const doc1 = parseCatalogXml(MISC_OBJECT_CATALOG_XML);
    const xml = serializeCatalog(doc1);
    const doc2 = parseCatalogXml(xml);

    expect(doc2.catalogName).toBe('MiscObjectCatalog');
    expect(doc2.entries).toHaveLength(1);
    expect(doc2.entries[0].definition.name).toBe('barrier');
  });
});
