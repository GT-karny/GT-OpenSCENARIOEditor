import { describe, it, expect } from 'vitest';
import {
  VFS,
  catalogNameFromXml,
  catalogVfsPath,
  rewriteLogicFilePath,
  rewriteCatalogDirectories,
  prepareScenarioForVfs,
} from '../../../lib/wasm/vfs-paths';

describe('vfs-paths', () => {
  describe('catalogNameFromXml', () => {
    it('extracts the internal <Catalog name="..."> value', () => {
      const xml = '<OpenSCENARIO><Catalog name="RoutesAtFabriksgatan"><Route/></Catalog></OpenSCENARIO>';
      expect(catalogNameFromXml(xml, 'fallback')).toBe('RoutesAtFabriksgatan');
    });

    it('tolerates extra attributes and whitespace before name', () => {
      const xml = '<Catalog\n   foo="bar"  name = "VehicleCatalog" >';
      expect(catalogNameFromXml(xml, 'fallback')).toBe('VehicleCatalog');
    });

    it('falls back to the provided key when no Catalog element is present', () => {
      expect(catalogNameFromXml('<OpenSCENARIO/>', 'MyKey')).toBe('MyKey');
    });
  });

  describe('catalogVfsPath', () => {
    it('names the file after the internal catalog name, not the key', () => {
      const xml = '<Catalog name="RoutesAtFabriksgatan">';
      // esmini resolves catalogName -> <dir>/<catalogName>.xosc, so the file
      // MUST be named after the internal name even if the key differs.
      expect(catalogVfsPath(xml, 'RouteCatalog')).toBe('/catalogs/RoutesAtFabriksgatan.xosc');
    });

    it('uses the key when the XML has no Catalog name', () => {
      expect(catalogVfsPath('<x/>', 'VehicleCatalog')).toBe('/catalogs/VehicleCatalog.xosc');
    });
  });

  describe('rewriteLogicFilePath', () => {
    it('rewrites the LogicFile filepath to the VFS road file', () => {
      const xosc = '<RoadNetwork><LogicFile filepath="../xodr/e6mini.xodr"/></RoadNetwork>';
      expect(rewriteLogicFilePath(xosc)).toContain(`filepath="${VFS.roadFile}"`);
      expect(rewriteLogicFilePath(xosc)).not.toContain('e6mini.xodr');
    });

    it('is a no-op when there is no LogicFile', () => {
      const xosc = '<RoadNetwork/>';
      expect(rewriteLogicFilePath(xosc)).toBe(xosc);
    });

    it('only rewrites the first LogicFile (single road network)', () => {
      const xosc =
        '<LogicFile filepath="a.xodr"/><SceneGraphFile filepath="b.osgb"/>';
      const out = rewriteLogicFilePath(xosc);
      expect(out).toContain(`<LogicFile filepath="${VFS.roadFile}"`);
      // SceneGraphFile must be untouched.
      expect(out).toContain('<SceneGraphFile filepath="b.osgb"');
    });
  });

  describe('rewriteCatalogDirectories', () => {
    it('rewrites every catalog Directory path to the VFS catalog dir', () => {
      const xosc =
        '<CatalogLocations>' +
        '<VehicleCatalog><Directory path="../xosc/Catalogs/Vehicles"/></VehicleCatalog>' +
        '<RouteCatalog><Directory path="../xosc/Catalogs/Routes"/></RouteCatalog>' +
        '</CatalogLocations>';
      const out = rewriteCatalogDirectories(xosc);
      expect(out).toContain(`<VehicleCatalog><Directory path="${VFS.catalogDir}/"`);
      expect(out).toContain(`<RouteCatalog><Directory path="${VFS.catalogDir}/"`);
      expect(out).not.toContain('../xosc/Catalogs');
    });

    it('handles whitespace/newlines between catalog and directory tags', () => {
      const xosc =
        '<PedestrianCatalog>\n   <Directory path="x"/>\n</PedestrianCatalog>';
      expect(rewriteCatalogDirectories(xosc)).toContain(`${VFS.catalogDir}/`);
    });
  });

  describe('prepareScenarioForVfs', () => {
    it('rewrites logic file + catalogs and names catalog files by internal name', () => {
      const xosc =
        '<OpenSCENARIO>' +
        '<RoadNetwork><LogicFile filepath="../xodr/e6mini.xodr"/></RoadNetwork>' +
        '<CatalogLocations><RouteCatalog><Directory path="../xosc/Catalogs/Routes"/></RouteCatalog></CatalogLocations>' +
        '</OpenSCENARIO>';
      const catalogs = {
        RouteCatalog: '<Catalog name="RoutesAtFabriksgatan"><Route/></Catalog>',
      };
      const prepared = prepareScenarioForVfs(xosc, '<xodr/>', catalogs);

      expect(prepared.hasRoad).toBe(true);
      expect(prepared.scenarioXml).toContain(`filepath="${VFS.roadFile}"`);
      expect(prepared.scenarioXml).toContain(`${VFS.catalogDir}/`);
      expect(prepared.catalogFiles).toHaveLength(1);
      expect(prepared.catalogFiles[0].path).toBe('/catalogs/RoutesAtFabriksgatan.xosc');
    });

    it('does not rewrite the LogicFile when no xodr is supplied', () => {
      const xosc = '<LogicFile filepath="keep.xodr"/>';
      const prepared = prepareScenarioForVfs(xosc, undefined, undefined);
      expect(prepared.hasRoad).toBe(false);
      expect(prepared.scenarioXml).toContain('keep.xodr');
      expect(prepared.catalogFiles).toEqual([]);
    });

    it('handles an empty catalog map without rewriting catalog dirs', () => {
      const xosc = '<CatalogLocations><VehicleCatalog><Directory path="orig"/></VehicleCatalog></CatalogLocations>';
      const prepared = prepareScenarioForVfs(xosc, undefined, {});
      expect(prepared.catalogFiles).toEqual([]);
      // With no catalogs to write, directories are left untouched.
      expect(prepared.scenarioXml).toContain('path="orig"');
    });
  });
});
