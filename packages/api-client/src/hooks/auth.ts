import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { LoginInput, ChangePasswordInput } from '@sprout/shared/schemas/user';

import { useApiClient } from '../provider';

type LoginResponse = Awaited<ReturnType<ReturnType<typeof useApiClient>['auth']['login']>>;
type ProfileResponse = Awaited<ReturnType<ReturnType<typeof useApiClient>['user']['profile']>>;
type OnboardingStatus = Awaited<
  ReturnType<ReturnType<typeof useApiClient>['onboarding']['status']>
>;

export const useLogin = (options?: UseMutationOptions<LoginResponse, Error, LoginInput>) => {
  const client = useApiClient();
  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: (input) => client.auth.login(input),
    ...options,
  });
};

export const useChangePassword = (
  options?: UseMutationOptions<
    Awaited<ReturnType<ReturnType<typeof useApiClient>['auth']['changePassword']>>,
    Error,
    ChangePasswordInput
  >,
) => {
  const client = useApiClient();
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => client.auth.changePassword(input),
    ...options,
  });
};

export const useProfile = (
  options?: Omit<UseQueryOptions<ProfileResponse>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<ProfileResponse>({
    queryKey: ['user', 'profile'],
    queryFn: () => client.user.profile(),
    ...options,
  });
};

export const useOnboardingStatus = (
  options?: Omit<UseQueryOptions<OnboardingStatus>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<OnboardingStatus>({
    queryKey: ['onboarding', 'status'],
    queryFn: () => client.onboarding.status(),
    ...options,
  });
};
