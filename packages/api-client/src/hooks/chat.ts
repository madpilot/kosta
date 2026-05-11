import { useCallback } from 'react';
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

import { useApiOptions } from '../provider';

const sessionsKey = ['chat', 'sessions'] as const;
const sessionKey = (id: string) => ['chat', 'sessions', id] as const;
const memoriesKey = ['chat', 'memories'] as const;

type SessionWithMessages = ChatSession & { messages: ChatMessage[] };
type SendMessageResponse = { userMessage: ChatMessage; assistantMessage: ChatMessage };
type SendMessageVars = SendMessageInput & { id: string };
type EndSessionResponse = { summary: string; memories: ChatMemory[] };

// The chat routes aren't yet wired through the oRPC RPCLink (no /rpc handler
// on the server), so the chat hooks talk to the existing REST endpoints
// directly using the same baseUrl / auth token configured on <ApiProvider>.
const useChatFetch = () => {
  const { baseUrl, getToken, onUnauthorized } = useApiOptions();

  return useCallback(
    async <T>(path: string, init?: RequestInit): Promise<T> => {
      const headers = new Headers(init?.headers);
      const token = getToken ? await getToken() : null;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      if (init?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      headers.set('Accept', 'application/json');

      const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, { ...init, headers });

      if (response.status === 401) {
        onUnauthorized?.();
        throw new Error('Unauthorized');
      }
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [baseUrl, getToken, onUnauthorized],
  );
};

export const useChatSessions = (
  options?: Omit<UseQueryOptions<ChatSession[]>, 'queryKey' | 'queryFn'>,
) => {
  const apiFetch = useChatFetch();
  return useQuery<ChatSession[]>({
    queryKey: sessionsKey,
    queryFn: () => apiFetch<ChatSession[]>('/api/chat/sessions'),
    ...options,
  });
};

export const useChatSession = (
  id: string,
  options?: Omit<UseQueryOptions<SessionWithMessages>, 'queryKey' | 'queryFn'>,
) => {
  const apiFetch = useChatFetch();
  return useQuery<SessionWithMessages>({
    queryKey: sessionKey(id),
    queryFn: () => apiFetch<SessionWithMessages>(`/api/chat/sessions/${id}`),
    enabled: Boolean(id),
    ...options,
  });
};

export const useCreateChatSession = (options?: UseMutationOptions<ChatSession, Error, void>) => {
  const apiFetch = useChatFetch();
  const queryClient = useQueryClient();
  return useMutation<ChatSession, Error, void>({
    mutationFn: () => apiFetch<ChatSession>('/api/chat/sessions', { method: 'POST' }),
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
  const apiFetch = useChatFetch();
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiFetch<{ success: boolean }>(`/api/chat/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: sessionsKey });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useSendChatMessage = (
  options?: UseMutationOptions<
    SendMessageResponse,
    Error,
    SendMessageVars,
    { previous: SessionWithMessages | undefined }
  >,
) => {
  const apiFetch = useChatFetch();
  const queryClient = useQueryClient();
  return useMutation<
    SendMessageResponse,
    Error,
    SendMessageVars,
    { previous: SessionWithMessages | undefined }
  >({
    mutationFn: ({ id, content }) =>
      apiFetch<SendMessageResponse>(`/api/chat/sessions/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onMutate: async ({ id, content }) => {
      await queryClient.cancelQueries({ queryKey: sessionKey(id) });
      const previous = queryClient.getQueryData<SessionWithMessages>(sessionKey(id));
      const now = new Date().toISOString();
      const optimisticMessage: ChatMessage = {
        id: `pending-${now}-${Math.random().toString(36).slice(2)}`,
        sessionId: id,
        role: 'user',
        content,
        model: null,
        createdAt: now,
      };
      queryClient.setQueryData<SessionWithMessages>(sessionKey(id), (old) =>
        old
          ? { ...old, messages: [...old.messages, optimisticMessage] }
          : {
              id,
              summary: null,
              createdAt: now,
              updatedAt: now,
              messages: [optimisticMessage],
            },
      );
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(sessionKey(vars.id), ctx.previous);
      } else {
        queryClient.removeQueries({ queryKey: sessionKey(vars.id) });
      }
    },
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: sessionKey(vars.id) });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
};

export const useEndChatSession = (
  options?: UseMutationOptions<EndSessionResponse, Error, { id: string }>,
) => {
  const apiFetch = useChatFetch();
  const queryClient = useQueryClient();
  return useMutation<EndSessionResponse, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiFetch<EndSessionResponse>(`/api/chat/sessions/${id}/end`, { method: 'POST' }),
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
  const apiFetch = useChatFetch();
  return useQuery<ChatMemory[]>({
    queryKey: memoriesKey,
    queryFn: () => apiFetch<ChatMemory[]>('/api/chat/memories'),
    ...options,
  });
};
