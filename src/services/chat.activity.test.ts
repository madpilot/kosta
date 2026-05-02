import { unlinkSync } from 'fs';
import path from 'path';

import { createChatService } from './chat';
import { createSqliteDatabase } from '../db/sqlite';

const chatMock = jest.fn();

jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({ chat: chatMock })),
}));

jest.mock('./weather', () => ({
  getWeatherForecast: jest.fn().mockResolvedValue(null),
}));

describe('chat agentic loop — activity log flow', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;
  let chatService: ReturnType<typeof createChatService>;

  beforeEach(() => {
    chatMock.mockReset();
    dbFile = path.join(__dirname, `chat_${Date.now()}_${Math.random().toString(36).slice(2)}.db`);
    database = createSqliteDatabase(dbFile);
    chatService = createChatService(database);
  });

  afterEach(() => {
    database.close();
    try { unlinkSync(dbFile); } catch { /* ignore */ }
    try { unlinkSync(`${dbFile}-wal`); } catch { /* ignore */ }
    try { unlinkSync(`${dbFile}-shm`); } catch { /* ignore */ }
  });

  it('records past activity (find_or_create_plant + update_plant_care) and proposes a schedule without persisting events', async () => {
    const session = chatService.createSession();
    const plantedDate = new Date('2026-05-02T00:00:00.000Z').toISOString();

    chatMock
      .mockResolvedValueOnce({
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            { function: { name: 'find_or_create_plant', arguments: { name: 'Basil', species: 'Ocimum basilicum', plantedDate } } },
          ],
        },
      })
      .mockImplementationOnce(async () => {
        const plant = database.getPlantByName('Basil');
        return {
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [
              { function: { name: 'update_plant_care', arguments: { plantId: plant!.id, plantedDate } } },
            ],
          },
        };
      })
      .mockResolvedValueOnce({
        message: {
          role: 'assistant',
          content: 'Logged that you planted basil today. Here\'s a proposed schedule:\n1. Water on 2026-05-03\n2. Check germination on 2026-05-12\n3. Transplant around 2026-05-30\n4. First harvest around 2026-06-20\n\nShall I add these to your calendar?',
        },
      });

    await chatService.sendMessage(session.id, 'Today I planted some basil seeds.');

    const plant = database.getPlantByName('Basil');
    expect(plant).not.toBeNull();
    expect(plant!.plantedDate).toBe(plantedDate);
    expect(database.getAllCalendarEvents()).toHaveLength(0);

    const messages = database.getChatMessages(session.id);
    const assistant = messages.find((m) => m.role === 'assistant');
    expect(assistant?.content).toMatch(/proposed schedule/i);
  });

  it('persists events via create_calendar_events_batch only after the user confirms', async () => {
    const session = chatService.createSession();
    const plant = database.createPlant({ name: 'Basil', species: 'Ocimum basilicum', plantedDate: new Date().toISOString() });

    chatMock
      .mockResolvedValueOnce({
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [
            {
              function: {
                name: 'create_calendar_events_batch',
                arguments: {
                  events: [
                    {
                      plantId: plant.id, type: 'water', date: '2026-05-03T08:00:00.000Z', notes: 'Water seedlings',
                    },
                    {
                      plantId: plant.id, type: 'other', date: '2026-05-12T08:00:00.000Z', notes: 'Check germination',
                    },
                    {
                      plantId: plant.id, type: 'other', date: '2026-05-30T08:00:00.000Z', notes: 'Transplant',
                    },
                  ],
                },
              },
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        message: {
          role: 'assistant',
          content: 'Done — 3 events added to your calendar.',
        },
      });

    await chatService.sendMessage(session.id, 'Yes please');

    const events = database.getAllCalendarEvents().filter((e) => e.plantId === plant.id);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.notes).sort()).toEqual(['Check germination', 'Transplant', 'Water seedlings']);
  });
});
