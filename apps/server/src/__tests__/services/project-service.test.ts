import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';
import { ProjectService, migrateProjectMeta } from '../../services/project-service.js';
import type { ProjectMeta } from '@osce/shared';

describe('ProjectService', () => {
  let service: ProjectService;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'osce-project-test-'));
    service = new ProjectService(tmpDir);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Project creation ────────────────────────────────────────

  describe('createProject', () => {
    it('should create a project with GT_Sim compatible directory structure', async () => {
      const detail = await service.createProject({ name: 'Test Project' });

      expect(detail.meta.name).toBe('Test Project');
      expect(detail.meta.description).toBe('');
      expect(detail.meta.id).toMatch(/^\d{8}-test-project$/);
      expect(detail.meta.createdAt).toBeDefined();
      expect(detail.meta.updatedAt).toBeDefined();

      // Verify directory structure
      const projectDir = path.join(tmpDir, detail.meta.id);
      const entries = await readdir(projectDir);
      expect(entries).toContain('project.json');
      expect(entries).toContain('xosc');
      expect(entries).toContain('xodr');
      expect(entries).toContain('catalogs');
      expect(entries).toContain('docs');

      // Verify catalogs subdirectories
      const catalogEntries = await readdir(path.join(projectDir, 'catalogs'));
      expect(catalogEntries).toContain('Vehicles');
      expect(catalogEntries).toContain('Controllers');
      expect(catalogEntries).toContain('Environments');
      expect(catalogEntries).toContain('Maneuvers');
      expect(catalogEntries).toContain('MiscObjects');
      expect(catalogEntries).toContain('Pedestrians');
      expect(catalogEntries).toContain('Routes');

      // Verify docs/img
      const docsEntries = await readdir(path.join(projectDir, 'docs'));
      expect(docsEntries).toContain('img');
    });

    it('should write valid project.json', async () => {
      const detail = await service.createProject({
        name: 'My Scenario',
        description: 'A test scenario',
      });

      const metaPath = path.join(tmpDir, detail.meta.id, 'project.json');
      const raw = await readFile(metaPath, 'utf-8');
      const meta = JSON.parse(raw) as ProjectMeta;

      expect(meta.id).toBe(detail.meta.id);
      expect(meta.name).toBe('My Scenario');
      expect(meta.description).toBe('A test scenario');
    });

    it('should reject empty project name', async () => {
      await expect(service.createProject({ name: '' })).rejects.toThrow(
        'Project name is required',
      );
    });

    it('should not include project.json in the files list', async () => {
      const detail = await service.createProject({ name: 'Test' });
      const projectJsonFiles = detail.files.filter((f) => f.name === 'project.json');
      expect(projectJsonFiles).toHaveLength(0);
    });
  });

  // ── Project listing ─────────────────────────────────────────

  describe('listProjects', () => {
    it('should list multiple projects', async () => {
      await service.createProject({ name: 'Project A' });
      await service.createProject({ name: 'Project B' });

      const projects = await service.listProjects();
      expect(projects).toHaveLength(2);

      const names = projects.map((p) => p.name);
      expect(names).toContain('Project A');
      expect(names).toContain('Project B');
    });

    it('should return empty array when no projects exist', async () => {
      const projects = await service.listProjects();
      expect(projects).toHaveLength(0);
    });

    it('should include scenarioCount', async () => {
      const detail = await service.createProject({ name: 'With Scenario' });
      const xoscDir = path.join(tmpDir, detail.meta.id, 'xosc');
      await writeFile(path.join(xoscDir, 'test.xosc'), '<OpenSCENARIO/>');

      const projects = await service.listProjects();
      const project = projects.find((p) => p.name === 'With Scenario');
      expect(project?.scenarioCount).toBe(1);
    });
  });

  // ── Project detail ──────────────────────────────────────────

  describe('getProject', () => {
    it('should return meta and file list', async () => {
      const created = await service.createProject({ name: 'Detail Test' });

      // Add a file
      await service.writeFile(created.meta.id, 'xosc/scenario.xosc', '<OpenSCENARIO/>');

      const detail = await service.getProject(created.meta.id);
      expect(detail.meta.name).toBe('Detail Test');

      const xoscFiles = detail.files.filter((f) => f.type === 'xosc');
      expect(xoscFiles).toHaveLength(1);
      expect(xoscFiles[0].relativePath).toBe('xosc/scenario.xosc');
    });

    it('should throw NotFoundError for nonexistent project', async () => {
      await expect(service.getProject('nonexistent-id')).rejects.toThrow('Project not found');
    });
  });

  // ── Project update ──────────────────────────────────────────

  describe('updateProject', () => {
    it('should update name and description', async () => {
      const created = await service.createProject({ name: 'Original' });
      const updated = await service.updateProject(created.meta.id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
      expect(updated.updatedAt).not.toBe(created.meta.updatedAt);
    });

    it('should throw NotFoundError for nonexistent project', async () => {
      await expect(
        service.updateProject('nonexistent-id', { name: 'New' }),
      ).rejects.toThrow('Project not found');
    });
  });

  // ── Project deletion ────────────────────────────────────────

  describe('deleteProject', () => {
    it('should remove the project directory', async () => {
      const created = await service.createProject({ name: 'To Delete' });
      const projectDir = path.join(tmpDir, created.meta.id);

      // Verify it exists
      const info = await stat(projectDir);
      expect(info.isDirectory()).toBe(true);

      await service.deleteProject(created.meta.id);

      // Verify it's gone
      await expect(stat(projectDir)).rejects.toThrow();
    });

    it('should throw NotFoundError for nonexistent project', async () => {
      await expect(service.deleteProject('nonexistent-id')).rejects.toThrow('Project not found');
    });
  });

  // ── File operations ─────────────────────────────────────────

  describe('readFile / writeFile', () => {
    it('should round-trip file content', async () => {
      const created = await service.createProject({ name: 'File Test' });
      const content = '<OpenSCENARIO version="1.2"/>';

      await service.writeFile(created.meta.id, 'xosc/test.xosc', content);
      const read = await service.readFile(created.meta.id, 'xosc/test.xosc');
      expect(read).toBe(content);
    });

    it('should auto-create parent directories', async () => {
      const created = await service.createProject({ name: 'Deep File' });
      await service.writeFile(created.meta.id, 'deep/nested/dir/file.txt', 'hello');
      const read = await service.readFile(created.meta.id, 'deep/nested/dir/file.txt');
      expect(read).toBe('hello');
    });

    it('should throw NotFoundError for missing file', async () => {
      const created = await service.createProject({ name: 'Missing File' });
      await expect(
        service.readFile(created.meta.id, 'nonexistent.txt'),
      ).rejects.toThrow('File not found');
    });
  });

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      const created = await service.createProject({ name: 'Delete File' });
      await service.writeFile(created.meta.id, 'xosc/temp.xosc', '<xml/>');

      await service.deleteFile(created.meta.id, 'xosc/temp.xosc');
      await expect(
        service.readFile(created.meta.id, 'xosc/temp.xosc'),
      ).rejects.toThrow('File not found');
    });

    it('should throw NotFoundError for missing file', async () => {
      const created = await service.createProject({ name: 'No File' });
      await expect(
        service.deleteFile(created.meta.id, 'nonexistent.txt'),
      ).rejects.toThrow('File not found');
    });
  });

  describe('renameFile', () => {
    it('should rename a file', async () => {
      const created = await service.createProject({ name: 'Rename Test' });
      await service.writeFile(created.meta.id, 'xosc/old.xosc', '<scenario/>');

      await service.renameFile(created.meta.id, 'xosc/old.xosc', 'xosc/new.xosc');

      const content = await service.readFile(created.meta.id, 'xosc/new.xosc');
      expect(content).toBe('<scenario/>');

      await expect(
        service.readFile(created.meta.id, 'xosc/old.xosc'),
      ).rejects.toThrow('File not found');
    });

    it('should throw NotFoundError for nonexistent source', async () => {
      const created = await service.createProject({ name: 'Rename Missing' });
      await expect(
        service.renameFile(created.meta.id, 'nonexistent.txt', 'new.txt'),
      ).rejects.toThrow('File not found');
    });
  });

  // ── ZIP export / import ─────────────────────────────────────

  describe('exportZip / importZip', () => {
    it('should round-trip a project through ZIP', async () => {
      const created = await service.createProject({ name: 'ZIP Test' });
      await service.writeFile(created.meta.id, 'xosc/scenario.xosc', '<OpenSCENARIO/>');
      await service.writeFile(created.meta.id, 'xodr/road.xodr', '<OpenDRIVE/>');

      // Export
      const zipBuffer = await service.exportZip(created.meta.id);
      expect(zipBuffer.length).toBeGreaterThan(0);

      // Verify ZIP contents
      const zip = new AdmZip(zipBuffer);
      const entryNames = zip.getEntries().map((e) => e.entryName);
      expect(entryNames).toContain('project.json');
      expect(entryNames).toContain('xosc/scenario.xosc');
      expect(entryNames).toContain('xodr/road.xodr');

      // Import
      const imported = await service.importZip(zipBuffer, 'Imported');
      expect(imported.meta.name).toBe('Imported');

      // Verify files exist in the imported project
      const xoscContent = await service.readFile(imported.meta.id, 'xosc/scenario.xosc');
      expect(xoscContent).toBe('<OpenSCENARIO/>');

      const xodrContent = await service.readFile(imported.meta.id, 'xodr/road.xodr');
      expect(xodrContent).toBe('<OpenDRIVE/>');
    });

    it('should import ZIP without name and use project.json name', async () => {
      const created = await service.createProject({ name: 'Named In Meta' });
      await service.writeFile(created.meta.id, 'xosc/test.xosc', '<xml/>');

      const zipBuffer = await service.exportZip(created.meta.id);
      const imported = await service.importZip(zipBuffer);
      expect(imported.meta.name).toBe('Named In Meta');
    });
  });

  // ── Path traversal ──────────────────────────────────────────

  describe('path traversal protection', () => {
    it('should reject paths with .. segments in readFile', async () => {
      const created = await service.createProject({ name: 'Security Test' });
      await expect(
        service.readFile(created.meta.id, '../../../etc/passwd'),
      ).rejects.toThrow('Path traversal is not allowed');
    });

    it('should reject paths with .. segments in writeFile', async () => {
      const created = await service.createProject({ name: 'Security Test' });
      await expect(
        service.writeFile(created.meta.id, '../outside.txt', 'bad'),
      ).rejects.toThrow('Path traversal is not allowed');
    });

    it('should reject paths with .. segments in deleteFile', async () => {
      const created = await service.createProject({ name: 'Security Test' });
      await expect(
        service.deleteFile(created.meta.id, '../../secret.txt'),
      ).rejects.toThrow('Path traversal is not allowed');
    });

    it('should reject project IDs with .. segments', async () => {
      await expect(
        service.getProject('../evil'),
      ).rejects.toThrow('Path traversal is not allowed');
    });
  });

  // ── project.json schema versioning ──────────────────────────

  describe('schemaVersion migration', () => {
    /** Overwrite a project's project.json with an arbitrary raw record. */
    async function writeRawMeta(id: string, meta: Record<string, unknown>): Promise<string> {
      const metaPath = path.join(tmpDir, id, 'project.json');
      await writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
      return metaPath;
    }

    it('migrates a pre-versioning (v1) project.json to the current schema version on read', async () => {
      const created = await service.createProject({ name: 'Legacy' });
      // Simulate a record written before schemaVersion existed (no such field).
      await writeRawMeta(created.meta.id, {
        id: created.meta.id,
        name: 'Legacy',
        description: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      const detail = await service.getProject(created.meta.id);
      expect(detail.meta.schemaVersion).toBe(2);
    });

    it('writes schemaVersion 2 on a freshly created project.json', async () => {
      const created = await service.createProject({ name: 'Fresh' });
      const raw = await readFile(path.join(tmpDir, created.meta.id, 'project.json'), 'utf-8');
      expect((JSON.parse(raw) as ProjectMeta).schemaVersion).toBe(2);
    });

    it('persists the migrated schemaVersion when an edit touches the project', async () => {
      const created = await service.createProject({ name: 'Touched' });
      const metaPath = await writeRawMeta(created.meta.id, {
        id: created.meta.id,
        name: 'Touched',
        description: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      });

      // Any write path runs touchUpdatedAt, which writes back the migrated meta.
      await service.writeFile(created.meta.id, 'xosc/a.xosc', '<OpenSCENARIO/>');

      const onDisk = JSON.parse(await readFile(metaPath, 'utf-8')) as ProjectMeta;
      expect(onDisk.schemaVersion).toBe(2);
    });

    it('preserves a newer, unknown schemaVersion instead of downgrading', async () => {
      const created = await service.createProject({ name: 'Future' });
      await writeRawMeta(created.meta.id, {
        id: created.meta.id,
        name: 'Future',
        description: '',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        schemaVersion: 99,
        futureField: 'keep-me',
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const detail = await service.getProject(created.meta.id);

      expect(detail.meta.schemaVersion).toBe(99);
      expect((detail.meta as unknown as Record<string, unknown>).futureField).toBe('keep-me');
      expect(warnSpy).toHaveBeenCalledOnce();
      warnSpy.mockRestore();
    });
  });
});

describe('migrateProjectMeta', () => {
  it('stamps the current version on a record with no schemaVersion (v1)', () => {
    const migrated = migrateProjectMeta({ id: 'a', name: 'A' });
    expect(migrated.schemaVersion).toBe(2);
  });

  it('leaves a current-version record at the current version', () => {
    const migrated = migrateProjectMeta({ id: 'a', name: 'A', schemaVersion: 2 });
    expect(migrated.schemaVersion).toBe(2);
  });

  it('does not downgrade a newer version and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const migrated = migrateProjectMeta({ id: 'a', name: 'A', schemaVersion: 5 });

    expect(migrated.schemaVersion).toBe(5);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });

  it('tolerates a null record', () => {
    expect(migrateProjectMeta(null).schemaVersion).toBe(2);
  });
});
