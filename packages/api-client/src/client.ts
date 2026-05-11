import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@sprout/shared/schemas/calendar';
import type { CreatePlantInput, Plant, UpdatePlantInput } from '@sprout/shared/schemas/plant';
import type { Settings, UpdateSettingsInput } from '@sprout/shared/schemas/settings';
import type { ChangePasswordInput, CreateUserInput, LoginInput } from '@sprout/shared/schemas/user';

export interface CreateClientOptions {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export interface OnboardingStatus {
  onboarded: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export interface OnboardingCompleteInput {
  user: CreateUserInput;
  settings: Settings;
}

export interface OnboardingCompleteResponse extends AuthResponse {
  settings: Settings;
}

export interface ApiClient {
  onboarding: {
    status: () => Promise<OnboardingStatus>;
    complete: (input: OnboardingCompleteInput) => Promise<OnboardingCompleteResponse>;
  };
  auth: {
    login: (input: LoginInput) => Promise<AuthResponse>;
    changePassword: (input: ChangePasswordInput) => Promise<{ success: boolean; message: string }>;
  };
  user: {
    profile: () => Promise<PublicUser>;
  };
  settings: {
    get: () => Promise<Settings>;
    update: (input: UpdateSettingsInput) => Promise<Settings>;
  };
  plants: {
    list: () => Promise<Plant[]>;
    get: (input: { id: string }) => Promise<Plant>;
    create: (input: CreatePlantInput) => Promise<Plant>;
    update: (input: UpdatePlantInput & { id: string }) => Promise<Plant>;
    delete: (input: { id: string }) => Promise<{ success: boolean }>;
  };
  calendar: {
    list: () => Promise<CalendarEvent[]>;
    today: () => Promise<CalendarEvent[]>;
    week: () => Promise<CalendarEvent[]>;
    month: () => Promise<CalendarEvent[]>;
    complete: (input: { id: string }) => Promise<{ success: boolean }>;
    create: (input: CreateCalendarEventInput) => Promise<CalendarEvent>;
    update: (input: UpdateCalendarEventInput & { id: string }) => Promise<CalendarEvent>;
    delete: (input: { id: string }) => Promise<{ success: boolean }>;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
}

export const createClient = (options: CreateClientOptions): ApiClient => {
  const { baseUrl, getToken, onUnauthorized } = options;
  const root = baseUrl.replace(/\/$/, '');

  const request = async <T>(opts: RequestOptions): Promise<T> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (getToken) {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${root}${opts.path}`, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (response.status === 401 && onUnauthorized) onUnauthorized();

    const text = await response.text();
    const parsed = text.length > 0 ? safeJsonParse(text) : undefined;

    if (!response.ok) {
      const message =
        (parsed &&
        typeof parsed === 'object' &&
        'error' in parsed &&
        typeof parsed.error === 'string'
          ? parsed.error
          : null) ?? `Request failed with status ${response.status}`;
      throw new ApiError(response.status, message, parsed);
    }

    return parsed as T;
  };

  return {
    onboarding: {
      status: () => request({ method: 'GET', path: '/api/onboarding/status' }),
      complete: (input) => request({ method: 'POST', path: '/api/onboarding', body: input }),
    },
    auth: {
      login: (input) => request({ method: 'POST', path: '/api/auth/login', body: input }),
      changePassword: (input) =>
        request({ method: 'POST', path: '/api/auth/change-password', body: input }),
    },
    user: {
      profile: () => request({ method: 'GET', path: '/api/user/profile' }),
    },
    settings: {
      get: () => request({ method: 'GET', path: '/api/settings' }),
      update: (input) => request({ method: 'PUT', path: '/api/settings', body: input }),
    },
    plants: {
      list: () => request({ method: 'GET', path: '/api/plants' }),
      get: ({ id }) => request({ method: 'GET', path: `/api/plants/${encodeURIComponent(id)}` }),
      create: (input) => request({ method: 'POST', path: '/api/plants', body: input }),
      update: ({ id, ...body }) =>
        request({ method: 'PUT', path: `/api/plants/${encodeURIComponent(id)}`, body }),
      delete: ({ id }) =>
        request({ method: 'DELETE', path: `/api/plants/${encodeURIComponent(id)}` }),
    },
    calendar: {
      list: () => request({ method: 'GET', path: '/api/calendar' }),
      today: () => request({ method: 'GET', path: '/api/calendar/today' }),
      week: () => request({ method: 'GET', path: '/api/calendar/week' }),
      month: () => request({ method: 'GET', path: '/api/calendar/month' }),
      complete: ({ id }) =>
        request({ method: 'PATCH', path: `/api/calendar/${encodeURIComponent(id)}/complete` }),
      create: (input) => request({ method: 'POST', path: '/api/calendar', body: input }),
      update: ({ id, ...body }) =>
        request({ method: 'PUT', path: `/api/calendar/${encodeURIComponent(id)}`, body }),
      delete: ({ id }) =>
        request({ method: 'DELETE', path: `/api/calendar/${encodeURIComponent(id)}` }),
    },
  };
};

const safeJsonParse = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};
