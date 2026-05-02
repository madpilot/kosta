import { buildTools, executeToolCall, buildSystemPrompt } from './ai';
import type { DatabaseWrapper, ChatDatabase } from '../db/index';
import type { Plant } from '../models/plant';
import type { CalendarEvent } from '../models/calendar';

const isoNow = () => new Date().toISOString();

const makePlant = (overrides: Partial<Plant> = {}): Plant => ({
  id: 'plant-1',
  name: 'Basil',
  species: 'Ocimum basilicum',
  createdAt: isoNow(),
  updatedAt: isoNow(),
  ...overrides,
});

const makeEvent = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'event-1',
  plantId: 'plant-1',
  type: 'water',
  date: isoNow(),
  completed: false,
  createdAt: isoNow(),
  updatedAt: isoNow(),
  ...overrides,
});

const stubDb = (overrides: Partial<DatabaseWrapper> = {}): DatabaseWrapper => ({
  getAllPlants: () => [],
  getPlantById: () => null,
  getPlantByName: () => null,
  createPlant: (p) => makePlant({ ...p, id: 'plant-new' }),
  updatePlant: () => null,
  updatePlantCareDates: () => null,
  deletePlant: () => false,
  getAllCalendarEvents: () => [],
  getCalendarEventById: () => null,
  createCalendarEvent: (e) => makeEvent({ ...e, id: `event-${Math.random().toString(36).slice(2, 8)}` }),
  close: () => undefined,
  ...overrides,
});

const stubChatDb = (): ChatDatabase => ({
  createChatSession: () => ({
    id: 's', summary: null, createdAt: isoNow(), updatedAt: isoNow(),
  }),
  getChatSession: () => null,
  updateChatSession: () => null,
  deleteChatSession: () => false,
  listChatSessions: () => [],
  createChatMessage: () => ({
    id: 'm', sessionId: 's', role: 'user', content: '', model: null, createdAt: isoNow(),
  }),
  getChatMessages: () => [],
  createChatMemory: () => ({
    id: 'mem', content: '', createdAt: isoNow(), updatedAt: isoNow(),
  }),
  listChatMemories: () => [],
});

describe('buildTools', () => {
  it('exposes the expected tool names', () => {
    const names = buildTools().map((t) => t.function.name).sort();
    expect(names).toEqual([
      'create_calendar_event',
      'create_calendar_events_batch',
      'find_or_create_plant',
      'get_plants',
      'update_plant_care',
    ]);
  });

  it('declares required params for each tool', () => {
    const byName = Object.fromEntries(
      buildTools().map((t) => [t.function.name, t.function.parameters]),
    );
    expect(byName.find_or_create_plant?.required).toEqual(['name']);
    expect(byName.update_plant_care?.required).toEqual(['plantId']);
    expect(byName.create_calendar_event?.required).toEqual(['plantId', 'type', 'date']);
    expect(byName.create_calendar_events_batch?.required).toEqual(['events']);
  });
});

describe('executeToolCall', () => {
  describe('find_or_create_plant', () => {
    it('returns the existing plant when one with that name exists', () => {
      const existing = makePlant({ id: 'plant-existing', name: 'Basil' });
      const db = stubDb({ getPlantByName: (n) => (n.toLowerCase() === 'basil' ? existing : null) });
      const result = executeToolCall('find_or_create_plant', { name: 'basil' }, db);
      expect(result).toBe(existing);
    });

    it('creates a new plant when none exists', () => {
      const created: Plant[] = [];
      const db = stubDb({
        getPlantByName: () => null,
        createPlant: (p) => {
          const plant = makePlant({ ...p, id: 'plant-new' });
          created.push(plant);
          return plant;
        },
      });
      const result = executeToolCall('find_or_create_plant', { name: 'Basil', species: 'Ocimum basilicum' }, db) as Plant;
      expect(created).toHaveLength(1);
      expect(result.name).toBe('Basil');
      expect(created[0].species).toBe('Ocimum basilicum');
    });

    it('falls back to using the common name as species if none provided', () => {
      const db = stubDb({
        getPlantByName: () => null,
        createPlant: (p) => makePlant({ ...p, id: 'plant-new' }),
      });
      const result = executeToolCall('find_or_create_plant', { name: 'Mystery Herb' }, db) as Plant;
      expect(result.species).toBe('Mystery Herb');
    });

    it('errors when name is missing', () => {
      const db = stubDb();
      const result = executeToolCall('find_or_create_plant', {}, db) as { error: string };
      expect(result.error).toMatch(/name/i);
    });
  });

  describe('update_plant_care', () => {
    it('delegates to db.updatePlantCareDates', () => {
      const calls: Array<{ id: string; dates: unknown }> = [];
      const updated = makePlant({ id: 'p1', lastWatered: '2026-05-01T00:00:00.000Z' });
      const db = stubDb({
        updatePlantCareDates: (id, dates) => {
          calls.push({ id, dates });
          return updated;
        },
      });
      const result = executeToolCall('update_plant_care', { plantId: 'p1', lastWatered: '2026-05-01T00:00:00.000Z' }, db);
      expect(result).toBe(updated);
      expect(calls[0].id).toBe('p1');
      expect(calls[0].dates).toEqual({
        lastWatered: '2026-05-01T00:00:00.000Z', lastFertilized: undefined, plantedDate: undefined, harvestDate: undefined,
      });
    });

    it('errors when plantId is missing', () => {
      const db = stubDb();
      const result = executeToolCall('update_plant_care', {}, db) as { error: string };
      expect(result.error).toMatch(/plantId/);
    });

    it('reports an error when the plant does not exist', () => {
      const db = stubDb({ updatePlantCareDates: () => null });
      const result = executeToolCall('update_plant_care', { plantId: 'unknown', lastWatered: isoNow() }, db) as { error: string };
      expect(result.error).toMatch(/unknown/);
    });
  });

  describe('create_calendar_events_batch', () => {
    it('creates each event and returns them in order', () => {
      const created: CalendarEvent[] = [];
      const db = stubDb({
        createCalendarEvent: (e) => {
          const evt = makeEvent({ ...e, id: `evt-${created.length}` });
          created.push(evt);
          return evt;
        },
      });
      const events = [
        { plantId: 'p1', type: 'water', date: '2026-05-03T08:00:00.000Z' },
        {
          plantId: 'p1', type: 'other', date: '2026-05-12T08:00:00.000Z', notes: 'Check germination',
        },
      ];
      const result = executeToolCall('create_calendar_events_batch', { events }, db) as CalendarEvent[];
      expect(result).toHaveLength(2);
      expect(result[1].notes).toBe('Check germination');
      expect(created).toHaveLength(2);
    });

    it('errors when events is empty', () => {
      const db = stubDb();
      const result = executeToolCall('create_calendar_events_batch', { events: [] }, db) as { error: string };
      expect(result.error).toMatch(/non-empty/);
    });

    it('returns per-event error objects when individual creates throw', () => {
      let calls = 0;
      const db = stubDb({
        createCalendarEvent: (e) => {
          calls += 1;
          if (calls === 2) throw new Error('boom');
          return makeEvent({ ...e, id: `evt-${calls}` });
        },
      });
      const events = [
        { plantId: 'p1', type: 'water', date: '2026-05-03T08:00:00.000Z' },
        { plantId: 'p1', type: 'water', date: '2026-05-04T08:00:00.000Z' },
        { plantId: 'p1', type: 'water', date: '2026-05-05T08:00:00.000Z' },
      ];
      const result = executeToolCall('create_calendar_events_batch', { events }, db) as Array<CalendarEvent | { error: string }>;
      expect(result).toHaveLength(3);
      expect((result[1] as { error: string }).error).toBe('boom');
    });
  });

  it('returns an error for an unknown tool', () => {
    const result = executeToolCall('not_a_tool', {}, stubDb()) as { error: string };
    expect(result.error).toMatch(/Unknown tool/);
  });
});

describe('buildSystemPrompt', () => {
  it('includes the activity-log routine instructions', async () => {
    const prompt = await buildSystemPrompt(stubChatDb());
    expect(prompt).toContain('find_or_create_plant');
    expect(prompt).toContain('update_plant_care');
    expect(prompt).toContain('create_calendar_events_batch');
    expect(prompt).toMatch(/past gardening activity/i);
    expect(prompt).toMatch(/Wait for the user to confirm/i);
  });

  it('includes today\'s date for relative-time anchoring', async () => {
    const prompt = await buildSystemPrompt(stubChatDb());
    expect(prompt).toMatch(/Today is /);
  });
});
