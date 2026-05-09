import { z } from 'zod';
import type { User } from '@sprout/shared/schemas/user';
import { CreateUserInputSchema } from '@sprout/shared/schemas/user';
import { SettingsSchema, type Settings } from '@sprout/shared/schemas/settings';
import type { SettingsDatabase, UserDatabase } from '../db/index';
import type { UserService } from './user';
import type { SettingsService } from './settings';

export const OnboardingInputSchema = z.object({
  user: CreateUserInputSchema,
  settings: SettingsSchema,
});

export type OnboardingInput = z.infer<typeof OnboardingInputSchema>;

export interface OnboardingStatus {
  onboarded: boolean;
}

export interface OnboardingResult {
  user: User;
  settings: Settings;
}

export type OnboardingDb = UserDatabase & SettingsDatabase;

export class OnboardingAlreadyCompleteError extends Error {
  constructor() {
    super('Onboarding has already been completed');
    this.name = 'OnboardingAlreadyCompleteError';
  }
}

// `userService` is typed structurally so tests can pass minimal stubs.
export const createOnboardingService = (
  db: OnboardingDb,
  userService: Pick<UserService, 'createUser'>,
  settingsService: Pick<SettingsService, 'saveSettings'>,
) => ({
  getStatus(): OnboardingStatus {
    return { onboarded: db.countUsers() > 0 };
  },

  // Throws OnboardingAlreadyCompleteError if a user already exists.
  complete(input: OnboardingInput): OnboardingResult {
    const parsed = OnboardingInputSchema.parse(input);
    if (db.countUsers() > 0) {
      throw new OnboardingAlreadyCompleteError();
    }
    const user = userService.createUser(parsed.user);
    const settings = settingsService.saveSettings(parsed.settings);
    return { user, settings };
  },
});

export type OnboardingService = ReturnType<typeof createOnboardingService>;

export default createOnboardingService;
