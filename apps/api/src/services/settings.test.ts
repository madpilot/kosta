import { unlinkSync } from 'fs';
import { createSqliteDatabase } from '../db/sqlite';
import { createSettingsService } from './settings';

describe('Settings Service', () => {
  let database: ReturnType<typeof createSqliteDatabase>;
  let service: ReturnType<typeof createSettingsService>;
  let dbFile: string;

  beforeEach(() => {
    dbFile = `${__dirname}/temp_settings_test_${Date.now()}_${Math.random()}.db`;
    database = createSqliteDatabase(dbFile);
    service = createSettingsService(database);
  });

  afterEach(() => {
    database.close();
    try {
      unlinkSync(dbFile);
    } catch {
      /* ignore */
    }
  });

  it('returns null when no settings have been saved', () => {
    expect(service.getSettings()).toBeNull();
  });

  it('persists and returns settings', () => {
    const saved = service.saveSettings({
      aiBackend: 'local',
      localAiBaseUrl: 'http://localhost:11434/v1',
      localAiModel: 'llama3.2',
      hemisphere: 'southern',
      location: 'Perth, AU',
    });

    expect(saved.aiBackend).toBe('local');
    expect(service.getSettings()).toEqual(saved);
  });

  it('overwrites previous settings on save', () => {
    service.saveSettings({
      aiBackend: 'local',
      localAiBaseUrl: 'http://localhost:11434/v1',
      localAiModel: 'llama3.2',
      hemisphere: 'southern',
    });

    service.saveSettings({
      aiBackend: 'openai',
      openaiApiKey: 'sk-test',
      openaiModel: 'gpt-4o',
      hemisphere: 'northern',
    });

    const current = service.getSettings();
    expect(current?.aiBackend).toBe('openai');
    expect(current?.openaiApiKey).toBe('sk-test');
    expect(current?.hemisphere).toBe('northern');
  });

  it('rejects openai backend without an api key', () => {
    expect(() =>
      service.saveSettings({
        aiBackend: 'openai',
        hemisphere: 'southern',
      }),
    ).toThrow();
  });
});
