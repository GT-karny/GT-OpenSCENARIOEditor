import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { initTestI18n } from '../../helpers/render-with-providers';

// `hasGtSimBridge` (imported by `ConnectionStatusSection`) is a module-level
// constant computed from `window.electronAPI` at the *first* time the store
// module is evaluated — so the "with bridge" scenarios below reset the module
// registry and re-import after stubbing `window.electronAPI`, while the
// "no bridge" scenario can rely on a plain static import (default: no bridge
// in this jsdom environment).
beforeAll(async () => {
  await initTestI18n();
});

afterEach(() => {
  cleanup();
  delete (window as unknown as { electronAPI?: unknown }).electronAPI;
});

describe('ConnectionStatusSection — no Electron bridge (browser dev)', () => {
  it('hides the connect form and shows a desktop-app hint', async () => {
    const { ConnectionStatusSection } = await import(
      '../../../features/gt-sim/settings/components/ConnectionStatusSection'
    );
    render(<ConnectionStatusSection />);

    expect(await screen.findByText(/desktop app/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});

describe('ConnectionStatusSection — with Electron bridge', () => {
  let gtSimConnect: ReturnType<typeof vi.fn>;
  let gtSimGetConnectConfig: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtSimConnect = vi.fn().mockResolvedValue({
      restBaseUrl: 'http://127.0.0.1:8000',
      wsBaseUrl: 'ws://127.0.0.1:8000',
      grpcPort: 50051,
    });
    gtSimGetConnectConfig = vi.fn().mockResolvedValue(null);
    (window as unknown as { electronAPI: unknown }).electronAPI = {
      isElectron: true,
      gtSimConnect,
      gtSimGetConnectConfig,
    };
  });

  async function renderSection() {
    vi.resetModules();
    const { ConnectionStatusSection } = await import(
      '../../../features/gt-sim/settings/components/ConnectionStatusSection'
    );
    return render(<ConnectionStatusSection />);
  }

  it('renders the form with default host/port when nothing is persisted', async () => {
    await renderSection();

    expect(await screen.findByRole('textbox')).toHaveValue('127.0.0.1');
    expect(screen.getByRole('spinbutton')).toHaveValue(8000);
  });

  it('primes host/port from the persisted connect config', async () => {
    gtSimGetConnectConfig.mockResolvedValue({ host: '10.0.0.5', port: 9001 });
    await renderSection();

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('10.0.0.5'));
    expect(screen.getByRole('spinbutton')).toHaveValue(9001);
  });

  it('calls gtSimConnect with the entered host/port on Connect', async () => {
    await renderSection();

    fireEvent.change(await screen.findByRole('textbox'), { target: { value: '192.168.1.10' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '9500' } });
    fireEvent.click(screen.getByRole('button', { name: /connect/i }));

    await waitFor(() =>
      expect(gtSimConnect).toHaveBeenCalledWith({ host: '192.168.1.10', port: 9500 }),
    );
  });

  it('disables Connect and shows an error for an out-of-range port', async () => {
    await renderSection();

    fireEvent.change(await screen.findByRole('spinbutton'), { target: { value: '0' } });

    expect(screen.getByRole('button', { name: /connect/i })).toBeDisabled();
    expect(screen.getByText(/1 and 65535/i)).toBeInTheDocument();
    expect(gtSimConnect).not.toHaveBeenCalled();
  });

  it('surfaces the connect error message on failure', async () => {
    gtSimConnect.mockRejectedValue(new Error('ECONNREFUSED'));
    await renderSection();

    fireEvent.click(await screen.findByRole('button', { name: /connect/i }));

    expect(await screen.findByText(/ECONNREFUSED/)).toBeInTheDocument();
  });
});
