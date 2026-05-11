import { useState } from 'react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Stack, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider } from '@sprout/api-client';
import tokens from '@sprout/shared/tokens';

export default function RootLayout() {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );

  const apiUrl =
    (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
    'http://localhost:3000';

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider
        baseUrl={apiUrl}
        getToken={() => SecureStore.getItemAsync('sprout_token')}
        onUnauthorized={() => {
          SecureStore.deleteItemAsync('sprout_token').catch(() => {});
          router.replace('/login');
        }}
      >
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tokens.color.forest[800] },
            headerTintColor: tokens.color.cream,
            contentStyle: { backgroundColor: tokens.color.forest[800] },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'Today' }} />
          <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
          <Stack.Screen name="chat" options={{ title: 'Chat' }} />
          <Stack.Screen name="login" options={{ title: 'Sign in' }} />
          <Stack.Screen name="onboarding" options={{ title: 'Welcome' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="plants/[plantId]" options={{ title: 'Plant' }} />
        </Stack>
      </ApiProvider>
    </QueryClientProvider>
  );
}
