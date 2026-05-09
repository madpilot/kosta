import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { Settings, UpdateSettingsInput } from '@sprout/shared/schemas/settings';

import { useApiClient } from '../provider';

const settingsKey = ['settings'] as const;

export const useSettings = (options?: Omit<UseQueryOptions<Settings>, 'queryKey' | 'queryFn'>) => {
  const client = useApiClient();
  return useQuery<Settings>({
    queryKey: settingsKey,
    queryFn: () => client.settings.get(),
    ...options,
  });
};

export const useUpdateSettings = (
  options?: UseMutationOptions<Settings, Error, UpdateSettingsInput>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Settings, Error, UpdateSettingsInput>({
    mutationFn: (input) => client.settings.update(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: settingsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};
