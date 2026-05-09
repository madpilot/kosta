import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';

import type { AppRouter } from '@sprout/api/orpc/router';

export interface CreateClientOptions {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export type ApiClient = RouterClient<AppRouter>;

export const createClient = (options: CreateClientOptions): ApiClient => {
  const { baseUrl, getToken, onUnauthorized } = options;

  const link = new RPCLink({
    url: `${baseUrl.replace(/\/$/, '')}/rpc`,
    headers: async () => {
      if (!getToken) return {};
      const token = await getToken();
      return token ? { authorization: `Bearer ${token}` } : {};
    },
    fetch: async (request, init) => {
      const response = await fetch(request, init);
      if (response.status === 401 && onUnauthorized) {
        onUnauthorized();
      }
      return response;
    },
  });

  return createORPCClient<ApiClient>(link);
};
