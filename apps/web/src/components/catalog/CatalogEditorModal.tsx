import { useTranslation } from '@osce/i18n';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { useCatalogStore } from '../../stores/catalog-store';
import { useCatalogOperations } from '../../hooks/use-catalog-operations';
import { CatalogList } from './CatalogList';
import { CatalogEntryList } from './CatalogEntryList';
import { CatalogEntryEditor } from './CatalogEntryEditor';
import { Upload, Download, BookOpen } from 'lucide-react';

export function CatalogEditorModal() {
  const { t } = useTranslation('common');
  const editorOpen = useCatalogStore((s) => s.editorOpen);
  const closeEditor = useCatalogStore((s) => s.closeEditor);
  const selectedCatalogName = useCatalogStore((s) => s.selectedCatalogName);
  const { loadCatalogFile, saveCatalogFile } = useCatalogOperations();

  return (
    <Dialog open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
      <DialogContent
        className="!max-w-none !w-[calc(100vw-80px)] !h-[calc(100vh-80px)] !translate-x-[-50%] !translate-y-[-50%] p-0 flex flex-col bg-[var(--color-bg-deep)] border-[var(--color-border-glass)]"
      >
        <DialogTitle className="sr-only">{t('catalog.editor')}</DialogTitle>

        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--color-border-glass)] bg-[var(--color-glass-1)] backdrop-blur-[28px] shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--color-accent-1)]" />
            <span className="text-sm font-medium font-display tracking-wider uppercase">
              {t('catalog.editor')}
            </span>
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={loadCatalogFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)] rounded transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> {t('catalog.load')}
          </button>
          {selectedCatalogName && (
            <button
              type="button"
              onClick={() => saveCatalogFile(selectedCatalogName)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-glass-2)] rounded transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> {t('catalog.save')}
            </button>
          )}
        </div>

        {/* 3-panel layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Catalog List */}
          <div className="w-[180px] shrink-0 border-r border-[var(--color-border-glass)] bg-[var(--color-bg-deep)]">
            <div className="px-3 py-2 border-b border-[var(--color-border-glass)]">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t('catalog.catalogs')}
              </p>
            </div>
            <CatalogList />
          </div>

          {/* Center: Entry List */}
          <div className="w-[240px] shrink-0 border-r border-[var(--color-border-glass)] bg-[var(--color-bg-deep)]">
            <div className="px-3 py-2 border-b border-[var(--color-border-glass)]">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t('catalog.entries')}
              </p>
            </div>
            <CatalogEntryList />
          </div>

          {/* Right: Entry Editor */}
          <div className="flex-1 bg-[var(--color-bg-deep)]">
            <CatalogEntryEditor />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
