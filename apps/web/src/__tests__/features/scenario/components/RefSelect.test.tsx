import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { initTestI18n, renderWithProviders } from '../../../helpers/render-with-providers';
import { RefSelect } from '../../../../features/scenario/components/property/RefSelect';
import type { RefSelectItem } from '../../../../features/scenario/components/property/RefSelect';

beforeAll(async () => {
  await initTestI18n();
});

// The shared test setup does not enable globals, so RTL auto-cleanup is off.
afterEach(cleanup);

const ITEMS: RefSelectItem[] = [
  { name: 'Alpha', description: 'first' },
  { name: 'Beta', group: 'Greek' },
  { name: 'Gamma', group: 'Greek' },
];

function openDropdown() {
  // The trigger button is the first button; clicking it opens the dropdown.
  fireEvent.click(screen.getAllByRole('button')[0]);
}

describe('RefSelect (generic core)', () => {
  it('filters items by the search query', () => {
    renderWithProviders(<RefSelect value="" onValueChange={() => {}} items={ITEMS} />);
    openDropdown();
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'gam' } });

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('accepts a manually typed unknown value on Enter (manual-input fallback)', () => {
    const onValueChange = vi.fn();
    renderWithProviders(<RefSelect value="" onValueChange={onValueChange} items={ITEMS} />);
    openDropdown();
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'CustomRef' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onValueChange).toHaveBeenCalledWith('CustomRef');
  });

  it('shows the invalid-value indicator when the value is not in items', () => {
    const { container } = renderWithProviders(
      <RefSelect value="DoesNotExist" onValueChange={() => {}} items={ITEMS} />,
    );
    // AlertTriangle renders an lucide svg with this class.
    expect(container.querySelector('.lucide-triangle-alert')).toBeInTheDocument();
  });

  it('does not show the indicator when the value exists in items', () => {
    const { container } = renderWithProviders(
      <RefSelect value="Alpha" onValueChange={() => {}} items={ITEMS} />,
    );
    expect(container.querySelector('.lucide-triangle-alert')).not.toBeInTheDocument();
  });

  it('renders group labels for grouped items', () => {
    renderWithProviders(<RefSelect value="" onValueChange={() => {}} items={ITEMS} />);
    openDropdown();
    expect(screen.getByText('Greek')).toBeInTheDocument();
  });

  it('selects an item via click', () => {
    const onValueChange = vi.fn();
    renderWithProviders(<RefSelect value="" onValueChange={onValueChange} items={ITEMS} />);
    openDropdown();
    fireEvent.mouseDown(screen.getByText('Beta'));
    expect(onValueChange).toHaveBeenCalledWith('Beta');
  });

  it('shows the empty message when there are no items', () => {
    renderWithProviders(
      <RefSelect value="" onValueChange={() => {}} items={[]} emptyMessage="Nothing here" />,
    );
    openDropdown();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('uses the description as inline secondary text', () => {
    renderWithProviders(<RefSelect value="" onValueChange={() => {}} items={ITEMS} />);
    openDropdown();
    const alphaRow = screen.getByText('Alpha').closest('button');
    expect(alphaRow).not.toBeNull();
    expect(within(alphaRow!).getByText('first')).toBeInTheDocument();
  });
});
