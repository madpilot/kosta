import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type {
  ChatSession,
  ChatMessage,
  ChatMemory,
  SendMessageInput,
} from '@sprout/shared/schemas/chat';

import { useApiClient } from '../provider';

const sessionsKey = ['chat', 'sessions'] as const;
const sessionKey = (id: string) => ['chat', 'sessions', id] as const;
const memoriesKey = ['chat', 'memories'] as const;

type SessionWithMessages = ChatSession & { messages: ChatMessage[] };

export const useChatSessions = (
  options?: Omit<UseQueryOptions<ChatSession[]>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<ChatSession[]>({
    queryKey: sessionsKey,
    queryFn: () => client.chat.listSessions(),
    ...options,
  });
};

export const useChatSession = (
  id: string,
  options?: Omit<UseQueryOptions<SessionWithMessages>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<SessionWithMessages>({
    queryKey: sessionKey(id),
    queryFn: () => client.chat.getSession({ id }),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreateChatSession = (options?: UseMutationOptions<ChatSession, Error, void>) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<ChatSession, Error, void>({
    mutationFn: () => client.chat.createSession(),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useDeleteChatSession = (
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) => client.chat.deleteSession({ id }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

type SendMessageResponse = { userMessage: ChatMessage; assistantMessage: ChatMessage };
type SendMessageVars = SendMessageInput & { id: string };

export const useSendChatMessage = (
  options?: UseMutationOptions<SendMessageResponse, Error, SendMessageVars>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<SendMessageResponse, Error, SendMessageVars>({
    mutationFn: ({ id, content }) => client.chat.sendMessage({ id, content }),
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: sessionKey(vars.id) });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

type EndSessionResponse = { summary: string; memories: ChatMemory[] };

export const useEndChatSession = (
  options?: UseMutationOptions<EndSessionResponse, Error, { id: string }>,
) => {
  const client = useApiClient();
  const queryClient = useQueryClient();
  return useMutation<EndSessionResponse, Error, { id: string }>({
    mutationFn: ({ id }) => client.chat.endSession({ id }),
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: sessionKey(vars.id) });
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      queryClient.invalidateQueries({ queryKey: memoriesKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useChatMemories = (
  options?: Omit<UseQueryOptions<ChatMemory[]>, 'queryKey' | 'queryFn'>,
) => {
  const client = useApiClient();
  return useQuery<ChatMemory[]>({
    queryKey: memoriesKey,
    queryFn: () => client.chat.listMemories(),
    ...options,
  });
};
