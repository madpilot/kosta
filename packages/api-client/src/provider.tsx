import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createClient, type ApiClient, type CreateClientOptions } from './client';

const ApiClientContext = createContext<ApiClient | null>(null);
const ApiOptionsContext = createContext<CreateClientOptions | null>(null);

export interface ApiProviderProps extends CreateClientOptions {
  children: ReactNode;
}

export const ApiProvider = ({ children, ...options }: ApiProviderProps) => {
  const client = useMemo(
    () => createClient(options),
    [options.baseUrl, options.getToken, options.onUnauthorized],
  );

  return (
    <ApiClientContext.Provider value={client}>
      <ApiOptionsContext.Provider value={options}>{children}</ApiOptionsContext.Provider>
    </ApiClientContext.Provider>
  );
};

export const useApiClient = (): ApiClient => {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used inside <ApiProvider>');
  }
  return client;
};

export const useApiOptions = (): CreateClientOptions => {
  const options = useContext(ApiOptionsContext);
  if (!options) {
    throw new Error('useApiOptions must be used inside <ApiProvider>');
  }
  return options;
};
