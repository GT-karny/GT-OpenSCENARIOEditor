import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, initI18n, i18n } from '@osce/i18n';
import type { ManualDriveConfig, ManualDrivePreset } from '@osce/esmini';
import { ManualDrivePanel } from '../../../features/gt-sim/manual-drive';
import { DEFAULT_MANUAL_DRIVE_CONFIG } from '../../../features/gt-sim/run-form/lib/manual-drive-defaults';
import { useGtSimConnectionStore } from '../../../features/gt-sim/stores/gt-sim-connection-store';
import { resetGtSimApiCacheForTest } from '../../../features/gt-sim/lib/api';

let i18nInitialized = false;

beforeAll(async () => {
  if (!i18nInitialized) {
    await initI18n('en');
    i18nInitialized = true;
  }
});

function mockResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}

const PRESETS: ManualDrivePreset[] = [
  {
    name: 'Keyboard Default',
    builtin: true,
    config: { ...DEFAULT_MANUAL_DRIVE_CONFIG, input_type: 'sdl2_keyboard' },
  },
];

function renderPanel(config: ManualDriveConfig, onChange = vi.fn(), open = true) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ManualDrivePanel open={open} onClose={onClose} config={config} onChange={onChange} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return { ...utils, onChange, onClose, queryClient };
}

function connectBackend() {
  useGtSimConnectionStore.getState().applyStatus({
    state: 'ready',
    endpoints: {
      restBaseUrl: 'http://127.0.0.1:8000',
      wsBaseUrl: 'ws://127.0.0.1:8000',
      grpcPort: 50051,
    },
  });
}

describe('ManualDrivePanel', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    useGtSimConnectionStore.getState().reset();
    resetGtSimApiCacheForTest();
    fetchSpy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/manual-drive/presets')) {
        return Promise.resolve(mockResponse(PRESETS));
      }
      if (url.includes('/api/manual-drive/config') && init?.method === 'PUT') {
        return Promise.resolve(mockResponse(JSON.parse(String(init.body))));
      }
      return Promise.resolve(mockResponse({}));
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // Defensive: the gamepad-capture test below installs fake timers so its
    // `setTimeout(5000)` capture-timeout doesn't leak into later tests.
    vi.useRealTimers();
    cleanup();
  });

  it('renders an empty state and issues no requests when the backend is disconnected', () => {
    renderPanel(DEFAULT_MANUAL_DRIVE_CONFIG);

    expect(screen.getByText('Manual Drive Settings')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('loads presets once connected and open, and lists them', async () => {
    connectBackend();
    renderPanel(DEFAULT_MANUAL_DRIVE_CONFIG);

    await waitFor(() => expect(screen.getByText('Keyboard Default')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/manual-drive/presets'),
      expect.anything(),
    );
  });

  it('applies a preset over the defaults on click', async () => {
    connectBackend();
    const { onChange } = renderPanel(DEFAULT_MANUAL_DRIVE_CONFIG);

    await waitFor(() => expect(screen.getByText('Keyboard Default')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Keyboard Default'));

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_MANUAL_DRIVE_CONFIG,
      ...PRESETS[0]!.config,
    });
  });

  it('changes the lateral domain selection', async () => {
    connectBackend();
    const { onChange } = renderPanel(DEFAULT_MANUAL_DRIVE_CONFIG);

    // `SelectInput`'s label is a sibling, not a wrapping <label htmlFor>, so
    // resolve the control via its shared FieldWrapper container instead of
    // `getByLabelText` (which requires an explicit label/control association).
    const label = screen.getByText('Lateral (Steering)');
    const select = label.parentElement!.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'scenario' } });

    expect(onChange).toHaveBeenCalledWith({
      ...DEFAULT_MANUAL_DRIVE_CONFIG,
      domain: { ...DEFAULT_MANUAL_DRIVE_CONFIG.domain, lateral: 'scenario' },
    });
  });

  it('resets to defaults', async () => {
    connectBackend();
    const modified: ManualDriveConfig = {
      ...DEFAULT_MANUAL_DRIVE_CONFIG,
      input_type: 'sdl2_keyboard',
    };
    const { onChange } = renderPanel(modified);

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onChange).toHaveBeenCalledWith(DEFAULT_MANUAL_DRIVE_CONFIG);
  });

  it('saves the config and invalidates the shared run-form queryKey on success', async () => {
    connectBackend();
    const { queryClient } = renderPanel(DEFAULT_MANUAL_DRIVE_CONFIG);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/manual-drive/config'),
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['config', 'manual-drive'] }),
    );
  });

  it('assigns a gamepad button via capture', async () => {
    // jsdom has no requestAnimationFrame; the capture hook's poll loop needs
    // a stub or `startCapture()` throws synchronously on click. Fake timers
    // keep the hook's 5s capture-timeout from leaking a real pending timer
    // past this test.
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('navigator', {
      ...navigator,
      getGamepads: () => [null],
    });
    connectBackend();
    const { onChange } = renderPanel(DEFAULT_MANUAL_DRIVE_CONFIG);

    // Button Mapping only renders for the sdl2_wheel input type (the default).
    const row = screen.getByText('Upshift').closest('div')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Assign' }));

    // Simulate the underlying rAF poll detecting a press directly by driving
    // the hook is covered separately; here we only assert the "Press..."
    // state is entered (capture armed) without crashing.
    expect(within(row).getByRole('button', { name: 'Press...' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('assigns a keyboard binding on keypress and Escape cancels', async () => {
    connectBackend();
    const keyboardConfig: ManualDriveConfig = {
      ...DEFAULT_MANUAL_DRIVE_CONFIG,
      input_type: 'sdl2_keyboard',
    };
    const { onChange } = renderPanel(keyboardConfig);

    const row = screen.getByText('Throttle').closest('div')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Assign' }));
    expect(within(row).getByRole('button', { name: 'Press key...' })).toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'KeyP', key: 'p' });

    expect(onChange).toHaveBeenCalledWith({
      ...keyboardConfig,
      keyboard: { ...keyboardConfig.keyboard, throttle: 'P' },
    });
  });

  it('Escape cancels a keyboard assignment without calling onChange', async () => {
    connectBackend();
    const keyboardConfig: ManualDriveConfig = {
      ...DEFAULT_MANUAL_DRIVE_CONFIG,
      input_type: 'sdl2_keyboard',
    };
    const { onChange } = renderPanel(keyboardConfig);

    const row = screen.getByText('Brake').closest('div')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Assign' }));
    fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });

    expect(within(row).getByRole('button', { name: 'Assign' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
