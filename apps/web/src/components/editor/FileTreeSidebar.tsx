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
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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

        {/* Context menu (right side) */}
        <div className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-0.5 hover:bg-[var(--color-glass-3)] rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <PenLine size={10} className="text-[var(--color-text-muted)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {node.isDirectory && (
                <DropdownMenuItem>
                  <Plus size={12} />
                  {t('fileTree.newFile')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <PenLine size={12} />
                {t('fileTree.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-400 focus:text-red-400">
                <Trash2 size={12} />
                {t('fileTree.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
            />
          ))}
        </>
      )}
    </>
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

  const { openXoscFromProject, openXodrFromProject, openCatalogFromProject } =
    useProjectFileOperations();

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const tree = useMemo(() => {
    if (!currentProject) return [];
    return buildTree(currentProject.files);
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
            className="p-0.5 hover:bg-[var(--color-glass-2)] rounded-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
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
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
