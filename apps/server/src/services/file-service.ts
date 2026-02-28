import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface FileEntry {
  name: string;
  path: string;
  type: 'xosc' | 'xodr' | 'other';
  size: number;
}

export class FileService {
  validatePath(filePath: string): string {
    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path is required');
    }

    // Reject paths with .. segments to prevent traversal
    // Check raw input before any normalization
    const segments = filePath.split(/[/\\]/);
    if (segments.includes('..')) {
      throw new ValidationError('Path traversal is not allowed');
    }

    return path.resolve(filePath);
  }

  async readFile(filePath: string): Promise<string> {
    const resolved = this.validatePath(filePath);
    try {
      return await readFile(resolved, 'utf-8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${filePath}`);
      }
      throw err;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const resolved = this.validatePath(filePath);
    await writeFile(resolved, content, 'utf-8');
  }

  async listFiles(dir: string, filter?: 'xosc' | 'xodr'): Promise<FileEntry[]> {
    const resolved = this.validatePath(dir);

    let entries: string[];
    try {
      entries = await readdir(resolved);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`Directory not found: ${dir}`);
      }
      throw err;
    }

    const results: FileEntry[] = [];

    for (const name of entries) {
      const fullPath = path.join(resolved, name);
      try {
        const info = await stat(fullPath);
        if (!info.isFile()) continue;

        const ext = path.extname(name).toLowerCase().slice(1);
        const fileType: FileEntry['type'] =
          ext === 'xosc' ? 'xosc' : ext === 'xodr' ? 'xodr' : 'other';

        if (filter && fileType !== filter) continue;

        results.push({
          name,
          path: fullPath,
          type: fileType,
          size: info.size,
        });
      } catch {
        // Skip files we can't stat
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }
}
