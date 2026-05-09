import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { Plant, CreatePlantInput, UpdatePlantInput } from '@sprout/shared/schemas/plant';

import { useApiClient } from '../provider';

const plantsKey = ['plants'] as const;
const plantKey = (id: string) => ['plants', id] as const;

export const usePlants = (options?: Omit<UseQueryOptions<Plant[]>, 'queryKey' | 'queryFn'>) => {
  const client = useApiClient();
  return useQuery<Plant[]>({
    queryKey: plantsKey,
    queryFn: () => client.plants.list(),
    ...options,
  });
};

export const usePlant = (
  id: string,
  options?: Omit<UseQueryOptions<Plant>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<Plant>({
    queryKey: plantKey(id),
    queryFn: () => client.plants.get({ id }),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreatePlant = (options?: UseMutationOptions<Plant, Error, CreatePlantInput>) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Plant, Error, CreatePlantInput>({
    mutationFn: (input) => client.plants.create(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: plantsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useUpdatePlant = (
  options?: UseMutationOptions<Plant, Error, UpdatePlantInput & { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<Plant, Error, UpdatePlantInput & { id: string }>({
    mutationFn: (input) => client.plants.update(input),
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: plantsKey });
      queryClient.invalidateQueries({ queryKey: plantKey(vars.id) });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useDeletePlant = (
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => client.plants.delete({ id }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: plantsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};
