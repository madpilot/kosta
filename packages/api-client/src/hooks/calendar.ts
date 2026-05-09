import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@sprout/shared/schemas/calendar';

import { useApiClient } from '../provider';

const eventsKey = ['calendar'] as const;
const todayKey = ['calendar', 'today'] as const;
const weekKey = ['calendar', 'week'] as const;
const monthKey = ['calendar', 'month'] as const;

export const useCalendarEvents = (
  options?: Omit<UseQueryOptions<CalendarEvent[]>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<CalendarEvent[]>({
    queryKey: eventsKey,
    queryFn: () => client.calendar.list(),
    ...options,
  });
};

export const useTodayEvents = () => {
  const client = useApiClient();
  return useQuery<CalendarEvent[]>({
    queryKey: todayKey,
    queryFn: () => client.calendar.today(),
  });
};

export const useWeekEvents = () => {
  const client = useApiClient();
  return useQuery<CalendarEvent[]>({
    queryKey: weekKey,
    queryFn: () => client.calendar.week(),
  });
};

export const useMonthEvents = () => {
  const client = useApiClient();
  return useQuery<CalendarEvent[]>({
    queryKey: monthKey,
    queryFn: () => client.calendar.month(),
  });
};

export const useCompleteEvent = (
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => client.calendar.complete({ id }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: eventsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useCreateEvent = (
  options?: UseMutationOptions<CalendarEvent, Error, CreateCalendarEventInput>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<CalendarEvent, Error, CreateCalendarEventInput>({
    mutationFn: (input) => client.calendar.create(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: eventsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useUpdateEvent = (
  options?: UseMutationOptions<CalendarEvent, Error, UpdateCalendarEventInput & { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<CalendarEvent, Error, UpdateCalendarEventInput & { id: string }>({
    mutationFn: (input) => client.calendar.update(input),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: eventsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useDeleteEvent = (
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => client.calendar.delete({ id }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: eventsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};
