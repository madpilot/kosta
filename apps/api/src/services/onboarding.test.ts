import { unlinkSync } from 'fs';
import { createSqliteDatabase } from '../db/sqlite';
import { createUserService } from './user';
import { createSettingsService } from './settings';
import { createOnboardingService, OnboardingAlreadyCompleteError } from './onboarding';

describe('Onboarding Service', () => {
  let database: ReturnType<typeof createSqliteDatabase>;
  let dbFile: string;
  let service: ReturnType<typeof createOnboardingService>;

  beforeEach(() => {
    dbFile = `${__dirname}/temp_onboarding_test_${Date.now()}_${Math.random()}.db`;
    database = createSqliteDatabase(dbFile);
    const userService = createUserService(database);
    const settingsService = createSettingsService(database);
    service = createOnboardingService(database, userService, settingsService);
  });

  afterEach(() => {
    database.close();
    try {
      unlinkSync(dbFile);
    } catch {
      /* ignore */
    }
  });

  const validInput = {
    user: {
      username: 'gardener',
      email: 'gardener@example.com',
      name: 'Gardener',
      password: 'correcthorsebatterystaple',
    },
    settings: {
      aiBackend: 'ollama' as const,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2',
      hemisphere: 'southern' as const,
      location: 'Perth, AU',
    },
  };

  it('reports onboarded=false before any user is created', () => {
    expect(service.getStatus()).toEqual({ onboarded: false });
  });

  it('creates the initial user and persists settings', () => {
    const result = service.complete(validInput);
    expect(result.user.username).toBe('gardener');
    expect(result.settings.aiBackend).toBe('ollama');
    expect(service.getStatus()).toEqual({ onboarded: true });
    expect(database.getSettings()?.location).toBe('Perth, AU');
  });

  it('refuses a second onboarding once a user exists', () => {
    service.complete(validInput);
    expect(() => service.complete(validInput)).toThrow(OnboardingAlreadyCompleteError);
  });

  it('rejects malformed input', () => {
    expect(() =>
      service.complete({
        user: { username: 'g', email: 'not-an-email', password: 'short' },
        settings: validInput.settings,
      } as unknown as typeof validInput),
    ).toThrow();
  });
});
