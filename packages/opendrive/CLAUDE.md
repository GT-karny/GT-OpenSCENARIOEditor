# packages/opendrive — OpenDRIVE parser & geometry rules

## Spec Compliance

Always reference the OpenDRIVE XSD before implementing or modifying:
- Primary: `Thirdparty/openscenario-v1.3.1/ASAM_OpenSCENARIO_v1.3.1_Schema/OpenSCENARIO.xsd`
- Road geometry (xodr): Follow ASAM OpenDRIVE 1.8 conventions

Never guess attribute names, enumerations, or element structures — verify against the schema.

## Parser / Serializer Contract

- Parser modules: `src/parser/` — XML → TypeScript objects
- Geometry modules: `src/geometry/` — road shape computation (clothoid, arc, line)
- Changes to parsing must be accompanied by serializer updates if applicable

## Coordinate System

- OpenDRIVE uses Z-up, right-handed coordinate system
- Road coordinates: (s, t, h) — s along reference line, t lateral, h height
- Heading is measured counter-clockwise from positive x-axis
