import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import AdmZip from 'adm-zip';
import { ProjectService } from '../../services/project-service.js';
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
});
