import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { StatusBadge } from '../../../features/gt-sim/ui/Badge';
import { initTestI18n } from '../../helpers/render-with-providers';

beforeAll(async () => {
  await initTestI18n();
});

afterEach(() => {
  cleanup();
});

describe('StatusBadge', () => {
  it('maps every known GtSimJobStatus to a translated label', () => {
    const cases: Array<[string, string]> = [
      ['queued', 'Queued'],
      ['running', 'Running'],
      ['completed', 'Completed'],
      ['failed', 'Failed'],
      ['cancelled', 'Cancelled'],
      ['timeout', 'Timed out'],
    ];
    for (const [status, label] of cases) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders an unrecognized status verbatim without a color class', () => {
    render(<StatusBadge status="mystery-status" />);
    const el = screen.getByText('mystery-status');
    expect(el.className).not.toMatch(/color-warning|color-info|color-success|color-destructive/);
  });

  it('only shows a visible border when bordered is true', () => {
    const { rerender } = render(<StatusBadge status="running" />);
    expect(screen.getByText('Running').className).not.toMatch(/(?:^| )border(?: |$)/);

    rerender(<StatusBadge status="running" bordered />);
    expect(screen.getByText('Running').className).toMatch(/(?:^| )border(?: |$)/);
  });
});
