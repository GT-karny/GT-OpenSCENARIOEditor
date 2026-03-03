import path from 'node:path';
import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';
import type {
  ProjectMeta,
  ProjectSummary,
  ProjectDetail,
  ProjectFileEntry,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectFileType,
} from '@osce/shared';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/** GT_Sim compatible catalog subdirectory names */
const CATALOG_DIRS = [
  'Vehicles',
  'Controllers',
  'Environments',
  'Maneuvers',
  'MiscObjects',
  'Pedestrians',
  'Routes',
] as const;

/** Classify a file by its extension for GT_Sim compatibility */
function classifyFile(filename: string): ProjectFileType {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.xosc') return 'xosc';
  if (ext === '.xodr') return 'xodr';
  if (['.osgb', '.fbx', '.obj', '.gltf', '.glb'].includes(ext)) return 'model';
  if (['.json', '.yaml', '.yml', '.xml'].includes(ext)) return 'config';
  if (['.md', '.txt'].includes(ext)) return 'doc';
  return 'other';
}

/** Generate a project ID from a name and the current date */
function generateProjectId(name: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30);
  return `${date}-${slug}`;
}

/** esmini sample scenarios to seed into the sample project */
const SAMPLE_SCENARIOS = [
  'cut-in.xosc',
  'cut-in_simple.xosc',
  'lane_change.xosc',
  'highway_merge.xosc',
  'pedestrian.xosc',
];

/** .xodr road files referenced by the sample scenarios */
const SAMPLE_ROADS = [
  'e6mini.xodr',
  'jolengatan.xodr',
  'soderleden.xodr',
  'fabriksgatan.xodr',
  'straight_500m.xodr',
];

/** Catalog files to include in the sample project */
const SAMPLE_CATALOGS: ReadonlyArray<{ dir: string; file: string }> = [
  { dir: 'Vehicles', file: 'VehicleCatalog.xosc' },
  { dir: 'Pedestrians', file: 'PedestrianCatalog.xosc' },
  { dir: 'Controllers', file: 'ControllerCatalog.xosc' },
  { dir: 'Routes', file: 'RoutesAtFabriksgatan.xosc' },
  { dir: 'Maneuvers', file: 'HWManeuvers.xosc' },
];

const SAMPLE_PROJECT_ID = 'esmini-samples';

export class ProjectService {
  private readonly basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath ?? path.resolve(process.cwd(), 'data/projects');
  }

  // ── Sample project seeding ──────────────────────────────────

  /**
   * Seed a sample project from esmini resources if:
   *   1. The esmini resources directory exists
   *   2. The sample project doesn't already exist
   *
   * Called once at server startup. Failures are silently ignored.
   */
  async seedSampleProject(): Promise<void> {
    await this.ensureBaseDir();

    // Already seeded?
    const projectDir = path.resolve(this.basePath, SAMPLE_PROJECT_ID);
    try {
      await fs.stat(path.join(projectDir, 'project.json'));
      return; // Already exists
    } catch {
      // Not yet seeded — continue
    }

    // Fixed path: repo-root/Thirdparty/esmini-demo_Windows/esmini-demo/resources
    // cwd is apps/server/ when run via pnpm filter, so go up two levels
    const esminiBase = path.resolve(process.cwd(), '../../Thirdparty/esmini-demo_Windows/esmini-demo/resources');

    try {
      await fs.stat(path.join(esminiBase, 'xosc'));
    } catch {
      return; // esmini resources not available — skip
    }

    const xoscDir = path.join(esminiBase, 'xosc');
    const xodrDir = path.join(esminiBase, 'xodr');

    // Create project structure
    await fs.mkdir(path.join(projectDir, 'xosc'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'xodr'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'docs', 'img'), { recursive: true });
    for (const cat of CATALOG_DIRS) {
      await fs.mkdir(path.join(projectDir, 'catalogs', cat), { recursive: true });
    }

    // Copy scenario files
    for (const file of SAMPLE_SCENARIOS) {
      await this.tryCopyFile(path.join(xoscDir, file), path.join(projectDir, 'xosc', file));
    }

    // Copy road files
    for (const file of SAMPLE_ROADS) {
      await this.tryCopyFile(path.join(xodrDir, file), path.join(projectDir, 'xodr', file));
    }

    // Copy catalog files
    for (const { dir, file } of SAMPLE_CATALOGS) {
      await this.tryCopyFile(
        path.join(xoscDir, 'Catalogs', dir, file),
        path.join(projectDir, 'catalogs', dir, file),
      );
    }

    // Write project.json
    const now = new Date().toISOString();
    const meta: ProjectMeta = {
      id: SAMPLE_PROJECT_ID,
      name: 'esmini Samples',
      description: 'Sample scenarios from esmini — cut-in, lane change, highway merge, pedestrian',
      createdAt: now,
      updatedAt: now,
      defaultScenario: 'xosc/cut-in.xosc',
    };

    await fs.writeFile(path.join(projectDir, 'project.json'), JSON.stringify(meta, null, 2), 'utf-8');
  }

  private async tryCopyFile(src: string, dest: string): Promise<void> {
    try {
      await fs.copyFile(src, dest);
    } catch {
      // Source file missing — skip silently
    }
  }

  // ── Path security ────────────────────────────────────────────

  /**
   * Resolve and validate that a path stays within the project directory.
   * Rejects any path containing `..` segments to prevent traversal.
   */
  private validateProjectPath(projectId: string, relativePath?: string): string {
    // Reject .. in the project ID itself
    if (projectId.includes('..')) {
      throw new ValidationError('Path traversal is not allowed');
    }

    const projectDir = path.resolve(this.basePath, projectId);

    if (!relativePath) return projectDir;

    // Reject raw `..` segments before resolve
    const segments = relativePath.split(/[/\\]/);
    if (segments.includes('..')) {
      throw new ValidationError('Path traversal is not allowed');
    }

    const resolved = path.resolve(projectDir, relativePath);
    if (!resolved.startsWith(projectDir + path.sep) && resolved !== projectDir) {
      throw new ValidationError('Path traversal is not allowed');
    }

    return resolved;
  }

  // ── Project CRUD ─────────────────────────────────────────────

  async listProjects(): Promise<ProjectSummary[]> {
    await this.ensureBaseDir();

    let entries: string[];
    try {
      entries = await fs.readdir(this.basePath);
    } catch {
      return [];
    }

    const summaries: ProjectSummary[] = [];

    for (const entry of entries) {
      const projectDir = path.join(this.basePath, entry);
      const metaPath = path.join(projectDir, 'project.json');

      try {
        const info = await fs.stat(projectDir);
        if (!info.isDirectory()) continue;

        const metaRaw = await fs.readFile(metaPath, 'utf-8');
        const meta = JSON.parse(metaRaw) as ProjectMeta;

        // Count .xosc files across the project
        const scenarioCount = await this.countXoscFiles(projectDir);

        summaries.push({
          id: meta.id,
          name: meta.name,
          description: meta.description,
          createdAt: meta.createdAt,
          updatedAt: meta.updatedAt,
          scenarioCount,
        });
      } catch {
        // Skip directories without valid project.json
      }
    }

    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getProject(id: string): Promise<ProjectDetail> {
    const projectDir = this.validateProjectPath(id);
    const meta = await this.readMeta(projectDir);
    const files = await this.collectFiles(projectDir, projectDir);
    return { meta, files };
  }

  async createProject(req: ProjectCreateRequest): Promise<ProjectDetail> {
    if (!req.name || typeof req.name !== 'string' || req.name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }

    await this.ensureBaseDir();

    const id = generateProjectId(req.name);
    const projectDir = path.resolve(this.basePath, id);

    // Create GT_Sim compatible directory structure
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(path.join(projectDir, 'xosc'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'xodr'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'docs', 'img'), { recursive: true });
    for (const cat of CATALOG_DIRS) {
      await fs.mkdir(path.join(projectDir, 'catalogs', cat), { recursive: true });
    }

    const now = new Date().toISOString();
    const meta: ProjectMeta = {
      id,
      name: req.name.trim(),
      description: req.description?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    };

    await fs.writeFile(path.join(projectDir, 'project.json'), JSON.stringify(meta, null, 2), 'utf-8');

    const files = await this.collectFiles(projectDir, projectDir);
    return { meta, files };
  }

  async updateProject(id: string, req: ProjectUpdateRequest): Promise<ProjectMeta> {
    const projectDir = this.validateProjectPath(id);
    const meta = await this.readMeta(projectDir);

    if (req.name !== undefined) meta.name = req.name.trim();
    if (req.description !== undefined) meta.description = req.description.trim();
    if (req.defaultScenario !== undefined) meta.defaultScenario = req.defaultScenario;
    meta.updatedAt = new Date().toISOString();

    await fs.writeFile(path.join(projectDir, 'project.json'), JSON.stringify(meta, null, 2), 'utf-8');

    return meta;
  }

  async deleteProject(id: string): Promise<void> {
    const projectDir = this.validateProjectPath(id);

    // Verify project exists
    await this.readMeta(projectDir);

    await fs.rm(projectDir, { recursive: true, force: true });
  }

  // ── File operations ──────────────────────────────────────────

  async readFile(projectId: string, relativePath: string): Promise<string> {
    const filePath = this.validateProjectPath(projectId, relativePath);

    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${relativePath}`);
      }
      throw err;
    }
  }

  async writeFile(projectId: string, relativePath: string, content: string): Promise<void> {
    const filePath = this.validateProjectPath(projectId, relativePath);

    // Auto-create parent directories
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');

    // Touch project.json updatedAt
    await this.touchUpdatedAt(projectId);
  }

  async deleteFile(projectId: string, relativePath: string): Promise<void> {
    const filePath = this.validateProjectPath(projectId, relativePath);

    try {
      await fs.unlink(filePath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${relativePath}`);
      }
      throw err;
    }

    await this.touchUpdatedAt(projectId);
  }

  async renameFile(projectId: string, oldPath: string, newPath: string): Promise<void> {
    const srcPath = this.validateProjectPath(projectId, oldPath);
    const destPath = this.validateProjectPath(projectId, newPath);

    try {
      await fs.stat(srcPath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`File not found: ${oldPath}`);
      }
      throw err;
    }

    // Auto-create destination parent directories
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.rename(srcPath, destPath);

    await this.touchUpdatedAt(projectId);
  }

  // ── ZIP export / import ──────────────────────────────────────

  async exportZip(projectId: string): Promise<Buffer> {
    const projectDir = this.validateProjectPath(projectId);

    // Verify project exists
    await this.readMeta(projectDir);

    const zip = new AdmZip();
    await this.addDirToZip(zip, projectDir, '');
    return zip.toBuffer();
  }

  async importZip(zipBuffer: Buffer, name?: string): Promise<ProjectDetail> {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    // Determine project name: provided, or from ZIP's project.json, or fallback
    let projectName = name?.trim();

    if (!projectName) {
      // Try to read project.json from the ZIP
      const metaEntry = entries.find(
        (e) => e.entryName === 'project.json' || e.entryName.endsWith('/project.json'),
      );
      if (metaEntry) {
        try {
          const metaContent = metaEntry.getData().toString('utf-8');
          const parsed = JSON.parse(metaContent) as Record<string, unknown>;
          if (typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
            projectName = parsed.name.trim();
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    if (!projectName) {
      projectName = 'Imported Project';
    }

    // Create the project shell
    const detail = await this.createProject({ name: projectName });
    const projectDir = this.validateProjectPath(detail.meta.id);

    // Extract ZIP contents into the project directory
    // Detect if the ZIP has a single root directory wrapping everything
    const prefix = this.detectZipPrefix(entries.map((e) => e.entryName));

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      let entryPath = entry.entryName;
      if (prefix) {
        entryPath = entryPath.slice(prefix.length);
      }

      // Skip empty paths after prefix removal
      if (!entryPath || entryPath === '') continue;

      // Skip project.json — we already created a fresh one
      if (entryPath === 'project.json') continue;

      const destPath = path.resolve(projectDir, entryPath);

      // Security: verify destination is within project dir
      if (!destPath.startsWith(projectDir + path.sep) && destPath !== projectDir) {
        continue; // Skip entries that would escape the project dir
      }

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, entry.getData());
    }

    // Re-read to get updated file list
    return this.getProject(detail.meta.id);
  }

  // ── Private helpers ──────────────────────────────────────────

  private async ensureBaseDir(): Promise<void> {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  private async readMeta(projectDir: string): Promise<ProjectMeta> {
    const metaPath = path.join(projectDir, 'project.json');
    try {
      const raw = await fs.readFile(metaPath, 'utf-8');
      return JSON.parse(raw) as ProjectMeta;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundError(`Project not found`);
      }
      throw err;
    }
  }

  private async touchUpdatedAt(projectId: string): Promise<void> {
    try {
      const projectDir = this.validateProjectPath(projectId);
      const meta = await this.readMeta(projectDir);
      meta.updatedAt = new Date().toISOString();
      await fs.writeFile(
        path.join(projectDir, 'project.json'),
        JSON.stringify(meta, null, 2),
        'utf-8',
      );
    } catch {
      // Non-critical — don't fail the parent operation
    }
  }

  private async collectFiles(dir: string, projectDir: string): Promise<ProjectFileEntry[]> {
    const results: ProjectFileEntry[] = [];

    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return results;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      try {
        const info = await fs.stat(fullPath);

        if (info.isDirectory()) {
          // Recurse into subdirectories
          const subFiles = await this.collectFiles(fullPath, projectDir);
          results.push(...subFiles);
        } else if (info.isFile()) {
          // Skip project.json — it's metadata, not a project file
          const relativePath = path.relative(projectDir, fullPath).replace(/\\/g, '/');
          if (relativePath === 'project.json') continue;

          results.push({
            name: entry,
            relativePath,
            type: classifyFile(entry),
            size: info.size,
            modifiedAt: info.mtime.toISOString(),
          });
        }
      } catch {
        // Skip files we can't stat
      }
    }

    return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  private async countXoscFiles(dir: string): Promise<number> {
    let count = 0;

    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return 0;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      try {
        const info = await fs.stat(fullPath);
        if (info.isDirectory()) {
          count += await this.countXoscFiles(fullPath);
        } else if (info.isFile() && path.extname(entry).toLowerCase() === '.xosc') {
          count++;
        }
      } catch {
        // Skip
      }
    }

    return count;
  }

  private async addDirToZip(zip: AdmZip, dirPath: string, zipPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const entryZipPath = zipPath ? `${zipPath}/${entry}` : entry;

      const info = await fs.stat(fullPath);
      if (info.isDirectory()) {
        await this.addDirToZip(zip, fullPath, entryZipPath);
      } else {
        const data = await fs.readFile(fullPath);
        zip.addFile(entryZipPath, data);
      }
    }
  }

  /**
   * Detect if all ZIP entries share a common directory prefix.
   * Returns the prefix (with trailing `/`) or empty string.
   */
  private detectZipPrefix(entryNames: string[]): string {
    const nonEmpty = entryNames.filter((n) => n.length > 0);
    if (nonEmpty.length === 0) return '';

    // Check if all entries start with "somedir/"
    const firstSlash = nonEmpty[0].indexOf('/');
    if (firstSlash < 0) return '';

    const candidate = nonEmpty[0].slice(0, firstSlash + 1);
    if (nonEmpty.every((n) => n.startsWith(candidate))) {
      return candidate;
    }

    return '';
  }
}
