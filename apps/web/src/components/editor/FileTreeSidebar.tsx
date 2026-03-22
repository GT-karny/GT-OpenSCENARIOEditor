import { useState, useMemo, useCallback } from 'react';
import type { ProjectFileEntry } from '@osce/shared';
import { useTranslation } from '@osce/i18n';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  MapPin,
  Car,
  File,
  FolderOpen,
  Folder,
  Plus,
  Trash2,
  PenLine,
  PanelLeftClose,
  Undo2,
  X,
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useProjectStore } from '../../stores/project-store';
import { useProjectFileOperations } from '../../hooks/use-project-file-operations';

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: ProjectFileEntry;
}

function buildTree(files: ProjectFileEntry[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.relativePath.split('/');
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      const existing = currentLevel.find((n) => n.name === part);
      if (existing) {
        if (isLast) {
          existing.file = file;
          existing.isDirectory = false;
        }
        currentLevel = existing.children;
      } else {
        const node: TreeNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        currentLevel.push(node);
        currentLevel = node.children;
      }
    }
  }

  // Sort: directories first, then alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(root);

  return root;
}

function getFileIcon(file?: ProjectFileEntry) {
  if (!file) return <File size={14} className="text-[var(--color-text-muted)]" />;
  switch (file.type) {
    case 'xosc':
      return <FileCode size={14} className="text-[var(--color-accent-1)]" />;
    case 'xodr':
      return <MapPin size={14} className="text-emerald-400" />;
    case 'model':
      return <Car size={14} className="text-amber-400" />;
    default:
      return <File size={14} className="text-[var(--color-text-muted)]" />;
  }
}

/** Check if a file path is inside a catalogs directory */
function isCatalogPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.startsWith('catalogs/') || lower.includes('/catalogs/');
}

/** Check if a file is clickable (can be opened) */
function isClickableFile(node: TreeNode): boolean {
  if (node.isDirectory) return false;
  if (node.file?.type === 'xosc') return true;
  if (node.file?.type === 'xodr') return true;
  return false;
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
  currentFilePath: string | null;
  currentXodrPath: string | null;
  onFileClick: (relativePath: string) => void;
  onXodrClick: (relativePath: string) => void;
  onCatalogClick: (relativePath: string) => void;
  onDeleteFile: (node: TreeNode) => void;
  onRenameFile: (node: TreeNode) => void;
}

function TreeNodeItem({
  node,
  depth,
  expandedPaths,
  toggleExpanded,
  currentFilePath,
  currentXodrPath,
  onFileClick,
  onXodrClick,
  onCatalogClick,
  onDeleteFile,
  onRenameFile,
}: TreeNodeItemProps) {
  const { t } = useTranslation('common');
  const isExpanded = expandedPaths.has(node.path);
  const isActiveScenario = !node.isDirectory && node.path === currentFilePath;
  const isActiveRoad = !node.isDirectory && node.path === currentXodrPath;
  const clickable = node.isDirectory || isClickableFile(node);

  const handleClick = () => {
    if (node.isDirectory) {
      toggleExpanded(node.path);
    } else if (node.file?.type === 'xosc') {
      if (isCatalogPath(node.path)) {
        onCatalogClick(node.path);
      } else {
        onFileClick(node.path);
      }
    } else if (node.file?.type === 'xodr') {
      onXodrClick(node.path);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="group relative">
            <button
              type="button"
              onClick={handleClick}
              className={`flex items-center w-full gap-1.5 px-2 py-1 text-xs transition-colors ${
                clickable ? 'cursor-pointer' : 'cursor-default'
              } ${
                isActiveScenario
                  ? 'bg-[var(--color-accent-1)]/10 text-[var(--color-accent-1)]'
                  : isActiveRoad
                    ? 'bg-emerald-400/10 text-emerald-400'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-glass-2)]'
              }`}
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
              {node.isDirectory ? (
                isExpanded ? (
                  <ChevronDown size={12} className="shrink-0" />
                ) : (
                  <ChevronRight size={12} className="shrink-0" />
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
                getFileIcon(node.file)
              )}
              <span className="truncate">{node.name}</span>
            </button>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-[140px]">
          {node.isDirectory && (
            <ContextMenuItem>
              <Plus size={12} />
              {t('fileTree.newFile')}
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onRenameFile(node)}>
            <PenLine size={12} />
            {t('fileTree.rename')}
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-400 focus:text-red-400"
            onClick={() => onDeleteFile(node)}
          >
            <Trash2 size={12} />
            {t('fileTree.delete')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {node.isDirectory && isExpanded && (
        <>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
              currentFilePath={currentFilePath}
              currentXodrPath={currentXodrPath}
              onFileClick={onFileClick}
              onXodrClick={onXodrClick}
              onCatalogClick={onCatalogClick}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
            />
          ))}
        </>
      )}
    </>
  );
}

/** Flat list item for a file in the trash section */
function TrashFileItem({
  file,
  onRestore,
  onPermanentDelete,
}: {
  file: ProjectFileEntry;
  onRestore: (path: string) => void;
  onPermanentDelete: (path: string, name: string) => void;
}) {
  const { t } = useTranslation('common');
  // Show the original path without .trash/ prefix
  const originalPath = file.relativePath.replace(/^\.trash\//, '');

  return (
    <div className="group flex items-center gap-1.5 px-2 py-1 text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-2)]">
      <span className="w-3 shrink-0" />
      {getFileIcon(file)}
      <span className="truncate flex-1" title={originalPath}>
        {file.name}
      </span>
      <div className="shrink-0 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onRestore(file.relativePath)}
          className="p-0.5 hover:bg-[var(--color-glass-3)] rounded-none text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          title={t('fileTree.restore')}
        >
          <Undo2 size={10} />
        </button>
        <button
          type="button"
          onClick={() => onPermanentDelete(file.relativePath, file.name)}
          className="p-0.5 hover:bg-[var(--color-glass-3)] rounded-none text-[var(--color-text-tertiary)] hover:text-red-400"
          title={t('fileTree.permanentDelete')}
        >
          <X size={10} />
        </button>
      </div>
    </div>
  );
}

interface FileTreeSidebarProps {
  onCollapse?: () => void;
}

export function FileTreeSidebar({ onCollapse }: FileTreeSidebarProps) {
  const { t } = useTranslation('common');
  const currentProject = useProjectStore((s) => s.currentProject);
  const currentFilePath = useProjectStore((s) => s.currentFilePath);
  const currentXodrPath = useProjectStore((s) => s.currentXodrPath);
  const renameFile = useProjectStore((s) => s.renameFile);
  const trashFile = useProjectStore((s) => s.trashFile);
  const restoreFile = useProjectStore((s) => s.restoreFile);
  const permanentlyDeleteFile = useProjectStore((s) => s.permanentlyDeleteFile);

  const { openXoscFromProject, openXodrFromProject, openCatalogFromProject } =
    useProjectFileOperations();

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [trashExpanded, setTrashExpanded] = useState(false);

  // Separate project files from trash files
  const { mainFiles, trashFiles } = useMemo(() => {
    if (!currentProject)
      return { mainFiles: [] as ProjectFileEntry[], trashFiles: [] as ProjectFileEntry[] };
    const main: ProjectFileEntry[] = [];
    const trash: ProjectFileEntry[] = [];
    for (const file of currentProject.files) {
      if (file.relativePath.startsWith('.trash/')) {
        trash.push(file);
      } else {
        main.push(file);
      }
    }
    return { mainFiles: main, trashFiles: trash };
  }, [currentProject]);

  const tree = useMemo(() => buildTree(mainFiles), [mainFiles]);

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

  const handleFileClick = useCallback(
    async (relativePath: string) => {
      await openXoscFromProject(relativePath);
    },
    [openXoscFromProject],
  );

  const handleXodrClick = useCallback(
    async (relativePath: string) => {
      await openXodrFromProject(relativePath);
    },
    [openXodrFromProject],
  );

  const handleCatalogClick = useCallback(
    async (relativePath: string) => {
      await openCatalogFromProject(relativePath);
    },
    [openCatalogFromProject],
  );

  const handleDeleteFile = useCallback((node: TreeNode) => {
    setDeleteTarget(node);
  }, []);

  const handleRenameFile = useCallback((node: TreeNode) => {
    // Strip extension for the input field
    const ext = node.name.includes('.') ? node.name.slice(node.name.lastIndexOf('.')) : '';
    const baseName = ext ? node.name.slice(0, -ext.length) : node.name;
    setRenameTarget(node);
    setRenameValue(baseName);
    setRenameError(null);
  }, []);

  const handleConfirmRename = useCallback(async () => {
    if (!renameTarget || !currentProject) return;
    const oldPath = renameTarget.path;
    const ext = renameTarget.name.includes('.')
      ? renameTarget.name.slice(renameTarget.name.lastIndexOf('.'))
      : '';
    const newName = renameValue.trim() + ext;
    const dir = oldPath.includes('/') ? oldPath.slice(0, oldPath.lastIndexOf('/')) : '';
    const newPath = dir ? `${dir}/${newName}` : newName;

    if (newPath === oldPath) {
      setRenameTarget(null);
      return;
    }

    // Check if file already exists
    const exists = currentProject.files.some((f) => f.relativePath === newPath);
    if (exists) {
      setRenameError(t('fileTree.fileExistsError'));
      return;
    }

    await renameFile(oldPath, newPath);
    setRenameTarget(null);
  }, [renameTarget, renameValue, currentProject, renameFile, t]);

  const handleConfirmTrash = useCallback(async () => {
    if (!deleteTarget) return;
    await trashFile(deleteTarget.path);
    setDeleteTarget(null);
  }, [deleteTarget, trashFile]);

  const handleRestore = useCallback(
    async (trashPath: string) => {
      await restoreFile(trashPath);
    },
    [restoreFile],
  );

  const handlePermanentDeleteRequest = useCallback((path: string, name: string) => {
    setPermanentDeleteTarget({ path, name });
  }, []);

  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!permanentDeleteTarget) return;
    await permanentlyDeleteFile(permanentDeleteTarget.path);
    setPermanentDeleteTarget(null);
  }, [permanentDeleteTarget, permanentlyDeleteFile]);

  if (!currentProject) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-deep)]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-glass-edge-mid)]">
        <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          {t('fileTree.title')}
        </span>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="p-0.5 hover:bg-[var(--color-glass-2)] rounded-none text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            title={t('fileTree.collapse')}
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {tree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
              currentFilePath={currentFilePath}
              currentXodrPath={currentXodrPath}
              onFileClick={handleFileClick}
              onXodrClick={handleXodrClick}
              onCatalogClick={handleCatalogClick}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
            />
          ))}
        </div>

        {/* Trash section */}
        {trashFiles.length > 0 && (
          <div className="border-t border-[var(--color-glass-edge-mid)]">
            <button
              type="button"
              onClick={() => setTrashExpanded((prev) => !prev)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-glass-2)] transition-colors"
            >
              {trashExpanded ? (
                <ChevronDown size={12} className="shrink-0" />
              ) : (
                <ChevronRight size={12} className="shrink-0" />
              )}
              <Trash2 size={14} className="shrink-0" />
              <span>{t('fileTree.trash')}</span>
              <span className="ml-auto text-[10px] bg-[var(--color-glass-2)] px-1.5 rounded-full">
                {trashFiles.length}
              </span>
            </button>
            {trashExpanded &&
              trashFiles.map((file) => (
                <TrashFileItem
                  key={file.relativePath}
                  file={file}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDeleteRequest}
                />
              ))}
          </div>
        )}
      </ScrollArea>

      {/* Trash confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text-primary)]">
              {t('fileTree.deleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-[var(--color-text-secondary)]">
              {t('fileTree.deleteConfirmDescription', { name: deleteTarget?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              {t('buttons.cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmTrash}>
              {t('fileTree.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent delete confirmation dialog */}
      <Dialog
        open={permanentDeleteTarget !== null}
        onOpenChange={(open) => !open && setPermanentDeleteTarget(null)}
      >
        <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text-primary)]">
              {t('fileTree.permanentDeleteConfirmTitle')}
            </DialogTitle>
            <DialogDescription className="text-[var(--color-text-secondary)]">
              {t('fileTree.permanentDeleteConfirmDescription', {
                name: permanentDeleteTarget?.name ?? '',
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setPermanentDeleteTarget(null)}>
              {t('buttons.cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmPermanentDelete}>
              {t('buttons.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameError(null);
          }
        }}
      >
        <DialogContent className="bg-[var(--color-bg-primary)] border-[var(--color-glass-edge-mid)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text-primary)]">
              {t('fileTree.renameTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-[var(--color-text-secondary)]" htmlFor="rename-input">
              {t('fileTree.newFileName')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value);
                  setRenameError(null);
                }}
                className="bg-[var(--color-glass-1)] border-[var(--color-glass-edge-mid)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                }}
              />
              {renameTarget && renameTarget.name.includes('.') && (
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {renameTarget.name.slice(renameTarget.name.lastIndexOf('.'))}
                </span>
              )}
            </div>
            {renameError && <p className="text-xs text-red-400">{renameError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRenameTarget(null);
                setRenameError(null);
              }}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmRename}
              disabled={
                !renameValue.trim() || !/^[a-zA-Z0-9_\-. ]+$/.test(renameValue.trim())
              }
              className="bg-[var(--color-accent-1)] text-white hover:bg-[var(--color-accent-1)]/90"
            >
              {t('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
