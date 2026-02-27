import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { initTestI18n, renderWithProviders } from '../helpers/render-with-providers';
import { ValidationPanel } from '../../components/panels/ValidationPanel';
import { useEditorStore } from '../../stores/editor-store';

beforeAll(async () => {
  await initTestI18n();
});

beforeEach(() => {
  useEditorStore.setState({ validationResult: null });
});

describe('ValidationPanel', () => {
  it('should render empty state when no validation result', () => {
    renderWithProviders(<ValidationPanel />);
    expect(screen.getByText(/Click validate/)).toBeInTheDocument();
  });

  it('should render validation results', () => {
    useEditorStore.setState({
      validationResult: {
        valid: false,
        errors: [
          {
            code: 'E001',
            message: 'Missing entity',
            messageKey: 'errors.missingEntity',
            severity: 'error',
            path: '/entities',
          },
        ],
        warnings: [
          {
            code: 'W001',
            message: 'Empty storyboard',
            messageKey: 'errors.emptyStoryboard',
            severity: 'warning',
            path: '/storyboard',
          },
        ],
      },
    });

    renderWithProviders(<ValidationPanel />);
    expect(screen.getAllByText('Missing entity').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Empty storyboard').length).toBeGreaterThan(0);
  });
});
