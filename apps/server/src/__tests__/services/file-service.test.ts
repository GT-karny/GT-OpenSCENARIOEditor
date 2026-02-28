import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileService } from '../../services/file-service.js';

describe('FileService', () => {
  let service: FileService;
  let tmpDir: string;

  beforeEach(async () => {
    service = new FileService();
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'osce-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('validatePath', () => {
    it('should resolve a valid path', () => {
      const result = service.validatePath(tmpDir);
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should reject paths with .. segments', () => {
      // Use string concatenation to prevent path.join from normalizing ..
      expect(() => service.validatePath(tmpDir + '/../etc/passwd')).toThrow(
        'Path traversal is not allowed',
      );
    });

    it('should reject empty path', () => {
      expect(() => service.validatePath('')).toThrow('File path is required');
    });
  });

  describe('readFile', () => {
    it('should read file contents', async () => {
      const filePath = path.join(tmpDir, 'test.txt');
      await writeFile(filePath, 'hello world', 'utf-8');

      const content = await service.readFile(filePath);
      expect(content).toBe('hello world');
    });

    it('should throw NotFoundError for missing file', async () => {
      const filePath = path.join(tmpDir, 'nonexistent.txt');
      await expect(service.readFile(filePath)).rejects.toThrow('File not found');
    });
  });

  describe('writeFile', () => {
    it('should write file contents', async () => {
      const filePath = path.join(tmpDir, 'output.txt');
      await service.writeFile(filePath, 'test content');

      const content = await service.readFile(filePath);
      expect(content).toBe('test content');
    });
  });

  describe('listFiles', () => {
    it('should list all files in a directory', async () => {
      await writeFile(path.join(tmpDir, 'a.xosc'), '<xml/>');
      await writeFile(path.join(tmpDir, 'b.xodr'), '<xml/>');
      await writeFile(path.join(tmpDir, 'c.txt'), 'text');

      const files = await service.listFiles(tmpDir);
      expect(files).toHaveLength(3);
      expect(files.map((f) => f.name)).toEqual(['a.xosc', 'b.xodr', 'c.txt']);
    });

    it('should filter by xosc', async () => {
      await writeFile(path.join(tmpDir, 'a.xosc'), '<xml/>');
      await writeFile(path.join(tmpDir, 'b.xodr'), '<xml/>');

      const files = await service.listFiles(tmpDir, 'xosc');
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('a.xosc');
      expect(files[0].type).toBe('xosc');
    });

    it('should filter by xodr', async () => {
      await writeFile(path.join(tmpDir, 'a.xosc'), '<xml/>');
      await writeFile(path.join(tmpDir, 'b.xodr'), '<xml/>');

      const files = await service.listFiles(tmpDir, 'xodr');
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('b.xodr');
    });

    it('should throw NotFoundError for missing directory', async () => {
      await expect(service.listFiles(path.join(tmpDir, 'nonexistent'))).rejects.toThrow(
        'Directory not found',
      );
    });

    it('should skip subdirectories', async () => {
      await writeFile(path.join(tmpDir, 'a.xosc'), '<xml/>');
      await mkdir(path.join(tmpDir, 'subdir'));

      const files = await service.listFiles(tmpDir);
      expect(files).toHaveLength(1);
    });
  });
});
