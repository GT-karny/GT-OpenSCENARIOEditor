import { createContext, useContext } from 'react';
import { useServerConnection } from '../hooks/use-server-connection';
import type { ServerConnection } from '../hooks/use-server-connection';
import type { ReactNode } from 'react';

const ServerConnectionContext = createContext<ServerConnection | null>(null);

export function ServerConnectionProvider({ children }: { children: ReactNode }) {
  const connection = useServerConnection();
  return (
    <ServerConnectionContext.Provider value={connection}>
      {children}
    </ServerConnectionContext.Provider>
  );
}

export function useServerConnectionContext(): ServerConnection {
  const ctx = useContext(ServerConnectionContext);
  if (!ctx) {
    throw new Error('useServerConnectionContext must be used within ServerConnectionProvider');
  }
  return ctx;
}
