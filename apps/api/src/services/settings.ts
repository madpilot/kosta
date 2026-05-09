import type { Settings, UpdateSettingsInput } from '@sprout/shared/schemas/settings';
import { UpdateSettingsInputSchema } from '@sprout/shared/schemas/settings';
import type { SettingsDatabase } from '../db/index';

export const createSettingsService = (db: SettingsDatabase) => ({
  getSettings(): Settings | null {
    return db.getSettings();
  },

  saveSettings(input: UpdateSettingsInput): Settings {
    const validated = UpdateSettingsInputSchema.parse(input);
    return db.saveSettings(validated);
  },
});

export type SettingsService = ReturnType<typeof createSettingsService>;

export default createSettingsService;
