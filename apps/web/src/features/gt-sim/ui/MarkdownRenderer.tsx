/**
 * GT_Sim UI primitive — MarkdownRenderer.
 *
 * Ported from the GT_Sim fork's `components/ui/MarkdownRenderer.tsx`
 * (`react-markdown` + `remark-gfm`, both already `apps/web` dependencies).
 * Restyled with APEX tokens; `rounded` → `rounded-none` per the corner-radius
 * rule. `content` is caller-supplied markdown (not a UI literal), so no i18n
 * keys are needed here.
 */
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

export interface MarkdownRendererProps {
  content: string;
  imageBaseUrl?: string;
  className?: string;
}

export function MarkdownRenderer({ content, imageBaseUrl, className }: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-6 font-display text-2xl font-bold text-[var(--color-foreground)]">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-5 font-display text-xl font-semibold text-[var(--color-foreground)]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-4 font-display text-lg font-medium text-[var(--color-foreground)]">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-3 leading-relaxed text-[var(--color-text-secondary)]">{children}</p>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-[var(--color-accent-vivid)] underline underline-offset-2 transition-colors hover:text-[var(--color-accent-bright)]"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    img: ({ src, alt }) => {
      const resolvedSrc =
        src && imageBaseUrl && !src.startsWith('http')
          ? `${imageBaseUrl.replace(/\/$/, '')}/${src.replace(/^\//, '')}`
          : src;
      return (
        <img
          src={resolvedSrc}
          alt={alt ?? ''}
          className="my-3 max-w-full rounded-none border border-[var(--color-glass-edge)]"
        />
      );
    },
    code: ({ children, className: codeClassName }) => {
      const isBlock = codeClassName?.startsWith('language-');
      if (isBlock) {
        return (
          <code
            className={cn(
              'my-3 block overflow-x-auto rounded-none bg-[var(--color-glass-1)] p-3 font-mono text-sm text-[var(--color-text-secondary)]',
              codeClassName,
            )}
          >
            {children}
          </code>
        );
      }
      return (
        <code className="rounded-none bg-[var(--color-glass-1)] px-1.5 py-0.5 font-mono text-sm text-[var(--color-foreground)]">
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto rounded-none border border-[var(--color-glass-edge)] bg-[var(--color-glass-1)] p-3">
        {children}
      </pre>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 list-inside list-disc space-y-1 text-[var(--color-text-secondary)]">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-inside list-decimal space-y-1 text-[var(--color-text-secondary)]">{children}</ol>
    ),
    li: ({ children }) => <li className="text-[var(--color-text-secondary)]">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-2 border-[var(--color-accent-vivid)] pl-4 italic text-[var(--color-text-secondary)]">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border border-[var(--color-glass-edge)] text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="border-b border-[var(--color-glass-edge)] bg-[var(--color-glass-1)]">{children}</thead>
    ),
    th: ({ children }) => (
      <th className="border-r border-[var(--color-glass-edge)] px-3 py-2 text-left font-medium text-[var(--color-foreground)] last:border-r-0">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-r border-[var(--color-glass-edge)]/50 px-3 py-2 text-[var(--color-text-secondary)] last:border-r-0">
        {children}
      </td>
    ),
    hr: () => <hr className="my-4 border-[var(--color-glass-edge)]" />,
  };

  return (
    <div className={className}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
