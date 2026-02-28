import { useCallback, useMemo } from 'react';
import { useTranslation } from '@osce/i18n';
import { toast } from 'sonner';
import { useWebSocket } from './use-websocket';
import { useSimulationStore } from '../stores/simulation-store';
import type { ConnectionStatus, WsServerMessage } from '../types/ws-messages';
import type { ScenarioDocument } from '@osce/shared';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3001/ws';

export interface ServerConnection {
  status: ConnectionStatus;
  isConnected: boolean;
  // Simulation
  startSimulation: (scenarioXml: string) => void;
  stopSimulation: () => void;
  requestSimulationStatus: () => void;
  // File operations (server-side path based)
  openServerFile: (filePath: string, fileType: 'xosc' | 'xodr') => void;
  saveServerFile: (filePath: string, document: ScenarioDocument) => void;
}

export function useServerConnection(): ServerConnection {
  const { t } = useTranslation('common');

  const handleMessage = useCallback((msg: WsServerMessage) => {
    switch (msg.type) {
      case 'simulation:frame':
        useSimulationStore.getState().addFrame(msg.payload);
        break;
      case 'simulation:complete':
        useSimulationStore.getState().setCompleted(msg.payload);
        break;
      case 'simulation:error':
        useSimulationStore.getState().setError(msg.payload.error);
        toast.error(msg.payload.error);
        break;
      case 'simulation:status':
        useSimulationStore.getState().setStatus(msg.payload.status);
        break;
      case 'file:saved':
        if (msg.payload.success) {
          toast.success(t('labels.fileSaved'));
        }
        break;
      case 'file:error':
        toast.error(msg.payload.error);
        break;
      case 'pong':
      case 'file:opened':
        // file:opened handler will be wired when server-side file browsing is added
        break;
    }
  }, [t]);

  const { status, send } = useWebSocket({
    url: WS_URL,
    onMessage: handleMessage,
  });

  const isConnected = status === 'connected';

  const startSimulation = useCallback(
    (scenarioXml: string) => {
      send({ type: 'simulation:start', payload: { scenarioXml } });
    },
    [send],
  );

  const stopSimulation = useCallback(() => {
    send({ type: 'simulation:stop' });
  }, [send]);

  const requestSimulationStatus = useCallback(() => {
    send({ type: 'simulation:status' });
  }, [send]);

  const openServerFile = useCallback(
    (filePath: string, fileType: 'xosc' | 'xodr') => {
      send({ type: 'file:open', payload: { filePath, fileType } });
    },
    [send],
  );

  const saveServerFile = useCallback(
    (filePath: string, document: ScenarioDocument) => {
      send({ type: 'file:save', payload: { filePath, document } });
    },
    [send],
  );

  return useMemo(
    () => ({
      status,
      isConnected,
      startSimulation,
      stopSimulation,
      requestSimulationStatus,
      openServerFile,
      saveServerFile,
    }),
    [status, isConnected, startSimulation, stopSimulation, requestSimulationStatus, openServerFile, saveServerFile],
  );
}
