import { describe, it, expect, beforeAll } from 'vitest';
import { screen } from '@testing-library/react';
import { initTestI18n, renderWithProviders } from '../helpers/render-with-providers';
import { TemplatePalettePanel } from '../../components/panels/TemplatePalettePanel';

beforeAll(async () => {
  await initTestI18n();
});

describe('TemplatePalettePanel', () => {
  it('should render the template panel', () => {
    renderWithProviders(<TemplatePalettePanel />);
    // The Highway category should be visible (default open)
    expect(screen.getAllByText(/Highway/).length).toBeGreaterThan(0);
  });
});
