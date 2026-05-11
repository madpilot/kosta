export { createClient, type ApiClient, type CreateClientOptions } from './client';
export { ApiProvider, useApiClient, type ApiProviderProps } from './provider';

export {
  usePlants,
  usePlant,
  useCreatePlant,
  useUpdatePlant,
  useDeletePlant,
} from './hooks/plants';

export {
  useCalendarEvents,
  useTodayEvents,
  useWeekEvents,
  useMonthEvents,
  useCompleteEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from './hooks/calendar';

export { useLogin, useChangePassword, useProfile, useOnboardingStatus } from './hooks/auth';

export { useSettings, useUpdateSettings } from './hooks/settings';

export {
  useChatSessions,
  useChatSession,
  useCreateChatSession,
  useDeleteChatSession,
  useSendChatMessage,
  useEndChatSession,
  useChatMemories,
} from './hooks/chat';
