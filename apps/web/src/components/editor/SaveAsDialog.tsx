import { useState, useMemo, useCallback } from 'react';
import type { ProjectFileEntry } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  FileCode,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { useProjectStore } from '../../stores/project-store';

// ─── Tree building ──────────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
}

/** Build a tree of directories and .xosc files under the xosc/ prefix. */
function buildXoscTree(files: ProjectFileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  // Collect directories and xosc files
  const dirs = new Set<string>();
  const xoscFiles: string[] = [];

  for (const f of files) {
    if (!f.relativePath.startsWith('xosc/')) continue;
    const parts = f.relativePath.split('/');
    // Collect directory paths
    for (let i = 1; i < parts.length; i++) {
      dirs.add(parts.slice(0, i).join('/'));
    }
    if (f.type === 'xosc') {
      xoscFiles.push(f.relativePath);
    }
  }

  // Always include xosc/ root
  dirs.add('xosc');

  // Build directory nodes
  for (const dirPath of [...dirs].sort()) {
    const parts = dirPath.split('/');
    if (parts.length === 1) {
      if (!root.find((n) => n.name === parts[0])) {
        root.push({ name: parts[0], path: dirPath, isDirectory: true, children: [] });
      }
      continue;
    }

    let currentLevel = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const parent = currentLevel.find((n) => n.name === parts[i]);
      if (parent) currentLevel = parent.children;
    }

    const name = parts[parts.length - 1];
    if (!currentLevel.find((n) => n.name === name)) {
      currentLevel.push({ name, path: dirPath, isDirectory: true, children: [] });
    }
  }

  // Add xosc files to their parent directories
  for (const filePath of xoscFiles) {
    const parts = filePath.split('/');
    const parentPath = parts.slice(0, -1).join('/');
    const fileName = parts[parts.length - 1];

    let currentLevel = root;
    for (const part of parentPath.split('/')) {
      const parent = currentLevel.find((n) => n.name === part);
      if (parent) currentLevel = parent.children;
    }

    if (!currentLevel.find((n) => n.name === fileName)) {
      currentLevel.push({ name: fileName, path: filePath, isDirectory: false, children: [] });
    }
  }

  // Sort: directories first, then files alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) sortNodes(node.children);
  };
  sortNodes(root);

  return root;
}

// ─── Tree node item ─────────────────────────────────────────────────────────

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
}

function TreeNodeItem({
  node,
  depth,
  selectedPath,
  expandedPaths,
  onSelect,
  onToggle,
}: TreeNodeItemProps) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = node.isDirectory && node.path === selectedPath;
  const hasChildren = node.children.length > 0;

  const handleClick = () => {
    if (node.isDirectory) {
      onSelect(node.path);
      if (hasChildren) onToggle(node.path);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center w-full gap-1.5 px-2 py-1 text-xs transition-colors ${
          node.isDirectory ? 'cursor-pointer' : 'cursor-default'
        } ${
          isSelected
            ? 'bg-[var(--color-accent-1)]/15 text-[var(--color-accent-1)]'
            : node.isDirectory
              ? 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-2)]'
              : 'text-[var(--color-text-muted)]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {node.isDirectory ? (
          hasChildren ? (
            isExpanded ? (
              <ChevronDown size={12} className="shrink-0" />
            ) : (
              <ChevronRight size={12} className="shrink-0" />
            )
          ) : (
            <span className="w-3 shrink-0" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {node.isDirectory ? (
          isExpanded ? (
            <FolderOpen size={14} className="shrink-0 text-[var(--color-accent-2)]" />
          ) : (
            <Folder size={14} className="shrink-0 text-[var(--color-accent-2)]" />
          )
        ) : (
          <FileCode size={14} className="shrink-0 text-[var(--color-text-muted)]" />
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {node.isDirectory && isExpanded && (
        <>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </>
      )}
    </>
  );
}

// ─── SaveAsDialog ───────────────────────────────────────────────────────────

interface SaveAsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (relativePath: string) => Promise<void>;
}

export function SaveAsDialog({ open, onOpenChange, onSave }: SaveAsDialogProps) {
  const { t } = useTranslation('common');
  const currentProject = useProjectStore((s) => s.currentProject);

  const [selectedDir, setSelectedDir] = useState('xosc');
  const [fileName, setFileName] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['xosc']));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tree = useMemo(() => {
    if (!currentProject) return [];
    return buildXoscTree(currentProject.files);
  }, [currentProject]);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Compute the full relative path
  const normalizedName = fileName.trim().replace(/\.xosc$/i, '');
  const fullPath = normalizedName ? `${selectedDir}/${normalizedName}.xosc` : '';

  // Check if file already exists
  const fileExists = useMemo(() => {
    if (!fullPath || !currentProject) return false;
    return currentProject.files.some((f) => f.relativePath === fullPath);
  }, [fullPath, currentProject]);

  const isValid = normalizedName.length > 0 && /^[a-zA-Z0-9_\-. ]+$/.test(normalizedName);

  const handleSave = async () => {
    if (!isValid || isSaving || !fullPath) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(fullPath);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSaving) {
      onOpenChange(nextOpen);
      if (!nextOpen) {
        setFileName('');
        setSelectedDir('xosc');
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[var(--color-text-primary)]">
            {t('saveAs.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Folder tree with files */}
          <div className="border border-[var(--color-glass-edge-mid)] bg-[var(--color-bg-deep)] rounded-none">
            <ScrollArea className="h-48">
              <div className="py-1">
                {tree.map((node) => (
                  <TreeNodeItem
                    key={node.path}
                    node={node}
                    depth={0}
                    selectedPath={selectedDir}
                    expandedPaths={expandedPaths}
                    onSelect={setSelectedDir}
                    onToggle={toggleExpanded}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* File name input */}
          <div className="space-y-2">
            <Label className="text-[var(--color-text-secondary)]" htmlFor="save-filename">
              {t('saveAs.fileName')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="save-filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="my-scenario"
                className="bg-[var(--color-glass-1)] border-[var(--color-glass-edge-mid)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] flex-1"
                disabled={isSaving}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
              <span className="text-xs text-[var(--color-text-muted)] shrink-0">.xosc</span>
            </div>
            {/* Path preview */}
            {normalizedName && (
              <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                {fullPath}
              </p>
            )}
          </div>

          {/* File exists warning */}
          {fileExists && (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{t('saveAs.fileExists')}</span>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
          >
            {isSaving && <Loader2 size={14} className="animate-spin mr-1" />}
            {t('saveAs.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
