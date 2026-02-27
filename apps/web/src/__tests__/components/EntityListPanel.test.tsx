import { describe, it, expect, beforeAll } from 'vitest';
import { screen } from '@testing-library/react';
import { initTestI18n, renderWithProviders } from '../helpers/render-with-providers';
import { EntityListPanel } from '../../components/panels/EntityListPanel';

beforeAll(async () => {
  await initTestI18n();
});

describe('EntityListPanel', () => {
  it('should render with empty state', () => {
    renderWithProviders(<EntityListPanel />);
    expect(screen.getByText(/No entities/)).toBeInTheDocument();
  });

  it('should render add button', () => {
    renderWithProviders(<EntityListPanel />);
    // There should be a + button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
