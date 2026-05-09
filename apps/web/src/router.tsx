import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import { RootLayout } from './components/RootLayout';
import { LoginScreen } from './screens/Login';
import { OnboardingScreen } from './screens/Onboarding';
import { TodayScreen } from './screens/Today';
import { CalendarScreen } from './screens/Calendar';
import { ChatScreen } from './screens/Chat';
import { PlantDetailScreen } from './screens/PlantDetail';

const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TodayScreen,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingScreen,
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarScreen,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: ChatScreen,
});

const plantDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plants/$plantId',
  component: PlantDetailScreen,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  onboardingRoute,
  calendarRoute,
  chatRoute,
  plantDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
