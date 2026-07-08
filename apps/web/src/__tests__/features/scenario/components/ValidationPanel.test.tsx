import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { initTestI18n, renderWithProviders } from '../../../helpers/render-with-providers';
import { ValidationPanel } from '../../../../features/scenario/components/panels/ValidationPanel';
import { useEditorStore } from '../../../../stores/editor-store';

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

  it('localizes a real messageKey with params', () => {
    useEditorStore.setState({
      validationResult: {
        valid: false,
        errors: [],
        warnings: [
          {
            code: 'STRUCT_003',
            message: 'Story "Main" has no Acts',
            messageKey: 'validation.struct003',
            params: { name: 'Main' },
            severity: 'warning',
            path: 'storyboard.stories.Main',
            elementId: 'story-1',
          },
        ],
      },
    });

    renderWithProviders(<ValidationPanel />);
    // The errors.validation.struct003 template interpolates {{name}} → "Main".
    expect(screen.getAllByText('Story "Main" has no Acts').length).toBeGreaterThan(0);
  });
});
