import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createClient, type ApiClient, type CreateClientOptions } from './client';

const ApiClientContext = createContext<ApiClient | null>(null);

export interface ApiProviderProps extends CreateClientOptions {
  children: ReactNode;
}

export const ApiProvider = ({ children, ...options }: ApiProviderProps) => {
  const client = useMemo(
    () => createClient(options),
    [options.baseUrl, options.getToken, options.onUnauthorized],
  );

  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
};

export const useApiClient = (): ApiClient => {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used inside <ApiProvider>');
  }
  return client;
};
