import type { SettingsDatabase } from '../db/index';
import type { Settings, UpdateSettingsInput } from '../models/settings';
import { UpdateSettingsInputSchema } from '../models/settings';

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
