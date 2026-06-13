import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider, initI18n, i18n } from '@osce/i18n';
import type { StoreApi } from 'zustand/vanilla';
import type { ScenarioStore } from '@osce/scenario-engine';
import type { ReactElement, ReactNode } from 'react';
import {
  ScenarioStoreProvider,
  useScenarioStoreContext,
} from '../../stores/scenario-store-context';
import { EntityRefSelect } from '../../components/property/EntityRefSelect';
import { EntityRefMultiSelect } from '../../components/property/EntityRefMultiSelect';

beforeAll(async () => {
  await initI18n('en');
});

// The shared test setup does not enable globals, so RTL auto-cleanup is off.
afterEach(cleanup);

function seedStore(store: StoreApi<ScenarioStore>) {
  const s = store.getState();
  s.addEntity({
    name: 'Ego',
    type: 'vehicle',
    definition: {
      kind: 'catalogReference',
      catalogName: 'Vehicles',
      entryName: 'car_white',
      parameterAssignments: [],
    },
  });
  s.addEntity({
    name: 'Target',
    type: 'pedestrian',
    definition: {
      kind: 'catalogReference',
      catalogName: 'Pedestrians',
      entryName: 'walker',
      parameterAssignments: [],
    },
  });
  s.addParameter({ name: 'SpeedRef', parameterType: 'string', value: 'fast' });
  s.addVariable({ name: 'StateVar', variableType: 'string', value: 'idle' });
}

/** Captures the context store so the test can seed it before assertions. */
function StoreProbe({ onReady }: { onReady: (store: StoreApi<ScenarioStore>) => void }) {
  const store = useScenarioStoreContext();
  onReady(store);
  return null;
}

function renderSeeded(ui: ReactElement) {
  let captured: StoreApi<ScenarioStore> | null = null;
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={i18n}>
        <ScenarioStoreProvider>
          <StoreProbe
            onReady={(s) => {
              captured = s;
            }}
          />
          {children}
        </ScenarioStoreProvider>
      </I18nextProvider>
    );
  }
  const result = render(ui, { wrapper: Wrapper });
  if (!captured) throw new Error('store was not captured');
  act(() => seedStore(captured!));
  return result;
}

describe('EntityRefSelect (single)', () => {
  it('lists entities grouped by type from the store', () => {
    renderSeeded(<EntityRefSelect value="" onValueChange={() => {}} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('Ego')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Vehicle')).toBeInTheDocument();
    expect(screen.getByText('Pedestrian')).toBeInTheDocument();
  });

  it('switches to parameter/variable mode when the search starts with $', () => {
    renderSeeded(<EntityRefSelect value="" onValueChange={() => {}} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const input = screen.getByPlaceholderText('Search or type $...');
    fireEvent.change(input, { target: { value: '$' } });

    // Entities are hidden in parameter mode; params/vars remain.
    expect(screen.queryByText('Ego')).not.toBeInTheDocument();
    expect(screen.getByText('$SpeedRef')).toBeInTheDocument();
    expect(screen.getByText('$StateVar')).toBeInTheDocument();
  });

  it('selects a parameter ref with the $ prefix on click', () => {
    const onValueChange = vi.fn();
    renderSeeded(<EntityRefSelect value="" onValueChange={onValueChange} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    const input = screen.getByPlaceholderText('Search or type $...');
    fireEvent.change(input, { target: { value: '$Speed' } });
    fireEvent.mouseDown(screen.getByText('$SpeedRef'));

    expect(onValueChange).toHaveBeenCalledWith('$SpeedRef');
  });

  it('renders an empty option when allowEmpty is set', () => {
    renderSeeded(<EntityRefSelect value="" onValueChange={() => {}} allowEmpty />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(screen.getByText('(none)')).toBeInTheDocument();
  });
});

describe('EntityRefMultiSelect (multi)', () => {
  it('toggles membership on Enter and reports the new array', () => {
    const onValueChange = vi.fn();
    renderSeeded(<EntityRefMultiSelect value={[]} onValueChange={onValueChange} />);
    // The last button in the chip row is the + opener.
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);

    const input = screen.getByPlaceholderText('Search or type $...');
    // First flat item is the first entity; Enter toggles it on.
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onValueChange).toHaveBeenCalledWith(['Ego']);
  });

  it('removes a chip via its X button', () => {
    const onValueChange = vi.fn();
    renderSeeded(<EntityRefMultiSelect value={['Ego']} onValueChange={onValueChange} />);
    // The first button is the chip's X remove button (chips precede the + opener).
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onValueChange).toHaveBeenCalledWith([]);
  });
});
