import { describe, it, expect } from 'vitest';
import { createDefaultDocument } from '../store/defaults.js';
import { createDefaultEditorMetadata } from '../store/editor-metadata-types.js';
import { serializeOsceJson, isOsceJsonFormat } from '../serializer/osce-json-serializer.js';
import { parseOsceJson } from '../parser/osce-json-parser.js';

describe('osce-json round-trip', () => {
  it('serialize then parse returns equivalent document and metadata', () => {
    const doc = createDefaultDocument();
    const meta = createDefaultEditorMetadata();

    const json = serializeOsceJson(doc, meta);
    const result = parseOsceJson(json);

    expect(result.document).toEqual(doc);
    expect(result.metadata).toEqual(meta);
  });

  it('preserves non-default metadata through round-trip', () => {
    const doc = createDefaultDocument();
    const meta = createDefaultEditorMetadata();
    meta.virtualRoads = [{ virtualRoadId: 'vr-1', segmentRoadIds: ['r-1', 'r-2'] }];
    meta.settings.laneRouting.generateUturn = true;
    meta.settings.autoDetectEnabled = false;

    const json = serializeOsceJson(doc, meta);
    const result = parseOsceJson(json);

    expect(result.metadata.virtualRoads).toEqual(meta.virtualRoads);
    expect(result.metadata.settings.laneRouting.generateUturn).toBe(true);
    expect(result.metadata.settings.autoDetectEnabled).toBe(false);
  });
});

describe('isOsceJsonFormat', () => {
  it('returns true for valid .osce.json content', () => {
    const doc = createDefaultDocument();
    const meta = createDefaultEditorMetadata();
    const json = serializeOsceJson(doc, meta);

    expect(isOsceJsonFormat(json)).toBe(true);
  });

  it('returns false for plain .xodr XML content', () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><OpenDRIVE></OpenDRIVE>';
    expect(isOsceJsonFormat(xml)).toBe(false);
  });

  it('returns false for JSON without format field', () => {
    expect(isOsceJsonFormat('{"foo": "bar"}')).toBe(false);
  });

  it('returns false for invalid JSON', () => {
    expect(isOsceJsonFormat('not json at all')).toBe(false);
  });
});

describe('parseOsceJson', () => {
  it('applies defaults for missing metadata fields', () => {
    // Build a minimal valid .osce.json with missing metadata sub-fields
    const doc = createDefaultDocument();
    const minimalFile = {
      format: 'osce-editor',
      version: '1.0.0',
      openDriveDocument: doc,
      editorMetadata: {
        version: '1.0.0',
        // virtualRoads, junctionMetadata, and settings are missing
      },
    };
    const json = JSON.stringify(minimalFile);
    const result = parseOsceJson(json);

    expect(result.metadata.virtualRoads).toEqual([]);
    expect(result.metadata.junctionMetadata).toEqual([]);
    expect(result.metadata.settings).toBeDefined();
    expect(result.metadata.settings.laneRouting).toBeDefined();
    expect(result.metadata.settings.defaultJunctionType).toBe('default');
    expect(result.metadata.settings.autoDetectEnabled).toBe(true);
  });

  it('applies defaults when editorMetadata is entirely missing', () => {
    const doc = createDefaultDocument();
    const minimalFile = {
      format: 'osce-editor',
      version: '1.0.0',
      openDriveDocument: doc,
      // editorMetadata is missing
    };
    const json = JSON.stringify(minimalFile);
    const result = parseOsceJson(json);

    const defaults = createDefaultEditorMetadata();
    expect(result.metadata.version).toBe(defaults.version);
    expect(result.metadata.virtualRoads).toEqual([]);
    expect(result.metadata.settings).toEqual(defaults.settings);
  });

  it('throws on invalid format identifier', () => {
    const invalid = {
      format: 'wrong-format',
      version: '1.0.0',
      openDriveDocument: {},
    };
    expect(() => parseOsceJson(JSON.stringify(invalid))).toThrow(
      "Invalid .osce.json format: expected 'osce-editor', got 'wrong-format'",
    );
  });

  it('throws on missing openDriveDocument', () => {
    const noDoc = {
      format: 'osce-editor',
      version: '1.0.0',
    };
    expect(() => parseOsceJson(JSON.stringify(noDoc))).toThrow(
      'Missing openDriveDocument in .osce.json file',
    );
  });
});
