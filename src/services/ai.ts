import { Ollama } from 'ollama';
import type { Message, Tool } from 'ollama';
import { config } from '../config';
import { getCurrentSeason } from '../utils/season';
import { getWeatherForecast } from './weather';
import type { DatabaseWrapper, ChatDatabase } from '../db/index';

export const buildTools = (): Tool[] => [
  {
    type: 'function',
    function: {
      name: 'get_plants',
      description: "Retrieve all plants from the user's garden database. Use this when the user asks about their plants, what they've already planted, or when you need plant IDs to create calendar events.",
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_or_create_plant',
      description: "Look up a plant by name; if it doesn't exist, create it. Call this whenever the user mentions a plant by name (e.g. 'I planted basil', 'my tomatoes'). Returns the plant id needed for events and care updates. Infer a sensible Latin species (e.g. 'basil' → 'Ocimum basilicum') if the user didn't provide one.",
      parameters: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: 'Common name the user used for the plant, e.g. "basil"',
          },
          species: {
            type: 'string',
            description: 'Latin species name. If unknown, infer a plausible one for the common name.',
          },
          plantedDate: {
            type: 'string',
            description: 'ISO 8601 date-time the plant was first sown/planted, if mentioned.',
          },
          location: {
            type: 'string',
            description: "Where in the user's garden the plant lives (optional).",
          },
          sunlightRequirement: {
            type: 'string',
            enum: ['full-sun', 'partial-shade', 'shade'],
            description: 'Sunlight requirement (optional).',
          },
          notes: {
            type: 'string',
            description: 'Optional free-text notes.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_plant_care',
      description: 'Record that the user has performed a care action on a plant (e.g. watered, fertilised, planted, harvested). Call this immediately when the user reports a past activity — recording a fact the user just stated does NOT require confirmation. All date fields are ISO 8601.',
      parameters: {
        type: 'object',
        required: ['plantId'],
        properties: {
          plantId: {
            type: 'string',
            description: 'The UUID of the plant (from find_or_create_plant or get_plants).',
          },
          lastWatered: { type: 'string', description: 'ISO 8601 datetime the plant was last watered.' },
          lastFertilized: { type: 'string', description: 'ISO 8601 datetime the plant was last fertilised.' },
          plantedDate: { type: 'string', description: 'ISO 8601 datetime the plant was planted.' },
          harvestDate: { type: 'string', description: 'ISO 8601 datetime of harvest.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a single garden calendar event for a specific plant. Always confirm with the user before calling this — only call it when the user has agreed to schedule the task. For a batch of related events use create_calendar_events_batch instead.',
      parameters: {
        type: 'object',
        required: ['plantId', 'type', 'date'],
        properties: {
          plantId: {
            type: 'string',
            description: 'The UUID of the plant this event is for (from get_plants or find_or_create_plant)',
          },
          type: {
            type: 'string',
            enum: ['water', 'fertilize', 'harvest', 'other'],
            description: 'The type of garden task',
          },
          date: {
            type: 'string',
            description: 'ISO 8601 date-time for the event, e.g. 2025-04-28T09:00:00.000Z',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the task',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_calendar_events_batch',
      description: "Create multiple future calendar events in one call. Use this AFTER the user has confirmed a proposed schedule (e.g. they replied 'yes' to a numbered list of upcoming tasks).",
      parameters: {
        type: 'object',
        required: ['events'],
        properties: {
          events: {
            type: 'array',
            description: 'List of events to create (one row per call).',
            items: {
              type: 'object',
              required: ['plantId', 'type', 'date'],
              properties: {
                plantId: { type: 'string' },
                type: { type: 'string', enum: ['water', 'fertilize', 'harvest', 'other'] },
                date: { type: 'string', description: 'ISO 8601 date-time' },
                notes: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
];

type ToolArgs = Record<string, unknown>;

type CalendarEventArgs = {
  plantId: string;
  type: 'water' | 'fertilize' | 'harvest' | 'other';
  date: string;
  notes?: string;
};

export const executeToolCall = (
  name: string,
  args: ToolArgs,
  db: DatabaseWrapper,
): unknown => {
  if (name === 'get_plants') {
    return db.getAllPlants();
  }

  if (name === 'find_or_create_plant') {
    const {
      name: plantName, species, plantedDate, location, sunlightRequirement, notes,
    } = args as {
      name: string;
      species?: string;
      plantedDate?: string;
      location?: string;
      sunlightRequirement?: 'full-sun' | 'partial-shade' | 'shade';
      notes?: string;
    };
    if (!plantName) return { error: 'name is required' };
    const existing = db.getPlantByName(plantName);
    if (existing) return existing;
    return db.createPlant({
      name: plantName,
      species: species || plantName,
      plantedDate,
      location,
      sunlightRequirement,
      notes,
    });
  }

  if (name === 'update_plant_care') {
    const {
      plantId, lastWatered, lastFertilized, plantedDate, harvestDate,
    } = args as {
      plantId: string;
      lastWatered?: string;
      lastFertilized?: string;
      plantedDate?: string;
      harvestDate?: string;
    };
    if (!plantId) return { error: 'plantId is required' };
    const updated = db.updatePlantCareDates(plantId, {
      lastWatered, lastFertilized, plantedDate, harvestDate,
    });
    return updated ?? { error: `No plant with id ${plantId}` };
  }

  if (name === 'create_calendar_event') {
    const {
      plantId, type, date, notes,
    } = args as CalendarEventArgs;
    return db.createCalendarEvent({
      plantId, type, date, notes: notes || undefined,
    });
  }

  if (name === 'create_calendar_events_batch') {
    const { events } = args as { events?: CalendarEventArgs[] };
    if (!Array.isArray(events) || events.length === 0) {
      return { error: 'events must be a non-empty array' };
    }
    return events.map((event) => {
      try {
        return db.createCalendarEvent({
          plantId: event.plantId,
          type: event.type,
          date: event.date,
          notes: event.notes || undefined,
        });
      } catch (err) {
        return { error: (err as Error).message, event };
      }
    });
  }

  return { error: `Unknown tool: ${name}` };
};

export const buildSystemPrompt = async (db: ChatDatabase): Promise<string> => {
  const { preamble } = config.ai;
  const { location, hemisphere } = config.user;
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const parts: string[] = [preamble, `\nToday is ${today}.`];

  if (location) {
    const season = getCurrentSeason(hemisphere);
    parts.push(`User's location: ${location} (${hemisphere}ern hemisphere)`);
    parts.push(`Current season: ${season}`);
  }

  if (config.weather.apiKey && location) {
    const forecast = await getWeatherForecast(location, config.weather.apiKey);
    if (forecast) {
      parts.push(`\nWeather forecast:\n${forecast}`);
    }
  }

  const memories = db.listChatMemories();
  if (memories.length > 0) {
    parts.push('\nUseful context from previous conversations:');
    memories.forEach((m) => parts.push(`- ${m.content}`));
  }

  return parts.join('\n');
};

export const createAiService = (db: DatabaseWrapper & ChatDatabase) => {
  const client = new Ollama({ host: config.ollama.baseUrl });

  const chat = async (
    history: { role: 'user' | 'assistant'; content: string }[],
    systemPrompt: string,
  ): Promise<string> => {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    const tools = buildTools();
    let response = await client.chat({ model: config.ollama.model, messages, tools });

    const workingMessages: Message[] = [...messages];

    // Tool calling loop — Ollama returns tool_calls until it's ready to respond
    while (response.message.tool_calls && response.message.tool_calls.length > 0) {
      workingMessages.push(response.message);

      for (const call of response.message.tool_calls) {
        let result: unknown;
        try {
          result = executeToolCall(call.function.name, call.function.arguments as ToolArgs, db);
        } catch (err) {
          result = { error: (err as Error).message };
        }
        workingMessages.push({ role: 'tool', content: JSON.stringify(result) });
      }

      response = await client.chat({ model: config.ollama.model, messages: workingMessages, tools });
    }

    return response.message.content;
  };

  const summariseSession = async (
    history: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ summary: string; memories: string[] }> => {
    const conversationText = history
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const response = await client.chat({
      model: config.ollama.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarises gardening conversations. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: `Summarise this gardening conversation and extract useful facts worth remembering for future sessions.\n\nConversation:\n${conversationText}\n\nRespond with JSON only:\n{"summary": "2-3 sentence summary", "memories": ["fact1", "fact2"]}`,
        },
      ],
      format: 'json',
    });

    try {
      const parsed = JSON.parse(response.message.content) as { summary?: string; memories?: unknown[] };
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        memories: Array.isArray(parsed.memories)
          ? (parsed.memories.filter((m): m is string => typeof m === 'string'))
          : [],
      };
    } catch {
      return { summary: response.message.content, memories: [] };
    }
  };

  return { chat, summariseSession };
};
