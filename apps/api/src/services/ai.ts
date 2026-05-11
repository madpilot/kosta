import { Ollama } from 'ollama';
import type { Message, Tool } from 'ollama';
import { z } from 'zod';
import { getRuntimeConfig } from '../runtime-config';
import { getCurrentSeason } from '../utils/season';
import { getWeatherForecast } from './weather';
import { logger } from '../utils/logger';
import type { DatabaseWrapper, ChatDatabase, SettingsDatabase } from '../db/index';

export const buildTools = (): Tool[] => [
  {
    type: 'function',
    function: {
      name: 'get_plants',
      description:
        "Retrieve all plants from the user's garden database. Use this when the user asks about their plants, what they've already planted, or when you need plant IDs to create calendar events.",
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
      description:
        "Look up a plant by name; if it doesn't exist, create it. Call this whenever the user mentions a plant by name (e.g. 'I planted basil', 'my tomatoes'). Returns the plant id needed for events and care updates. Infer a sensible Latin species (e.g. 'basil' → 'Ocimum basilicum') if the user didn't provide one.",
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
            description:
              'Latin species name. If unknown, infer a plausible one for the common name.',
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
      description:
        'Record that the user has performed a care action on a plant (e.g. watered, fertilised, planted, harvested). Call this immediately when the user reports a past activity — recording a fact the user just stated does NOT require confirmation. All date fields are ISO 8601.',
      parameters: {
        type: 'object',
        required: ['plantId'],
        properties: {
          plantId: {
            type: 'string',
            description: 'The UUID of the plant (from find_or_create_plant or get_plants).',
          },
          lastWatered: {
            type: 'string',
            description: 'ISO 8601 datetime the plant was last watered.',
          },
          lastFertilized: {
            type: 'string',
            description: 'ISO 8601 datetime the plant was last fertilised.',
          },
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
      description:
        'Create a single garden calendar event for a specific plant. Always confirm with the user before calling this — only call it when the user has agreed to schedule the task. For a batch of related events use create_calendar_events_batch instead.',
      parameters: {
        type: 'object',
        required: ['plantId', 'type', 'date'],
        properties: {
          plantId: {
            type: 'string',
            description:
              'The UUID of the plant this event is for (from get_plants or find_or_create_plant)',
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
      description:
        "Create multiple future calendar events in one call. Use this AFTER the user has confirmed a proposed schedule (e.g. they replied 'yes' to a numbered list of upcoming tasks).",
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

const MEMORY_PROMPT_LIMIT = 50;

const EventTypeSchema = z.enum(['water', 'fertilize', 'harvest', 'other']);
const IsoDateTimeSchema = z
  .string()
  .datetime({ message: 'must be an ISO 8601 datetime, e.g. 2026-05-03T08:00:00.000Z' });

const FindOrCreatePlantArgs = z.object({
  name: z.string().min(1),
  species: z.string().min(1).optional(),
  plantedDate: IsoDateTimeSchema.optional(),
  location: z.string().optional(),
  sunlightRequirement: z.enum(['full-sun', 'partial-shade', 'shade']).optional(),
  notes: z.string().optional(),
});

const UpdatePlantCareArgs = z
  .object({
    plantId: z
      .string()
      .uuid({ message: 'plantId must be a UUID returned by find_or_create_plant or get_plants' }),
    lastWatered: IsoDateTimeSchema.optional(),
    lastFertilized: IsoDateTimeSchema.optional(),
    plantedDate: IsoDateTimeSchema.optional(),
    harvestDate: IsoDateTimeSchema.optional(),
  })
  .refine(
    (data) =>
      Boolean(data.lastWatered || data.lastFertilized || data.plantedDate || data.harvestDate),
    {
      message:
        'at least one care date (lastWatered/lastFertilized/plantedDate/harvestDate) is required',
    },
  );

const CalendarEventArgsSchema = z.object({
  plantId: z
    .string()
    .uuid({ message: 'plantId must be a UUID returned by find_or_create_plant or get_plants' }),
  type: EventTypeSchema,
  date: IsoDateTimeSchema,
  notes: z.string().optional(),
});

const CreateCalendarEventsBatchArgs = z.object({
  events: z.array(CalendarEventArgsSchema).min(1, { message: 'events must be a non-empty array' }),
});

const formatZodError = (error: z.ZodError): string =>
  error.errors.map((e) => `${e.path.join('.') || '(root)'}: ${e.message}`).join('; ');

const KNOWN_TOOL_NAMES = new Set([
  'get_plants',
  'find_or_create_plant',
  'update_plant_care',
  'create_calendar_event',
  'create_calendar_events_batch',
]);

// Some local models occasionally hallucinate the JSON-schema fragment for a
// parameter as that parameter's value, e.g.
//   "location": '{"type":"string","description":"Where in the user\'s garden..."}'
// Drop those rather than passing garbage to the tool.
const looksLikeSchemaFragment = (value: unknown): boolean =>
  typeof value === 'string' && /^\s*\{\s*"type"\s*:\s*"/.test(value);

const sanitiseToolArgs = (args: Record<string, unknown>): ToolArgs => {
  const cleaned: ToolArgs = {};
  for (const [key, value] of Object.entries(args)) {
    if (!looksLikeSchemaFragment(value)) cleaned[key] = value;
  }
  return cleaned;
};

type RecoveredToolCall = { name: string; arguments: ToolArgs };

// Some models emit tool calls as plain JSON text in `message.content` instead
// of using Ollama's structured `tool_calls` field. Recover that so it goes
// through the normal tool-execution path rather than leaking to the user.
export const parseInlineToolCall = (content: string): RecoveredToolCall | null => {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as { name?: unknown; parameters?: unknown; arguments?: unknown };
  if (typeof obj.name !== 'string' || !KNOWN_TOOL_NAMES.has(obj.name)) return null;
  const rawArgs = obj.parameters ?? obj.arguments ?? {};
  if (typeof rawArgs !== 'object' || rawArgs === null) return null;
  return { name: obj.name, arguments: sanitiseToolArgs(rawArgs as Record<string, unknown>) };
};

export const executeToolCall = (name: string, args: ToolArgs, db: DatabaseWrapper): unknown => {
  if (name === 'get_plants') {
    return db.getAllPlants();
  }

  if (name === 'find_or_create_plant') {
    const parsed = FindOrCreatePlantArgs.safeParse(args);
    if (!parsed.success) return { error: formatZodError(parsed.error) };
    const {
      name: plantName,
      species,
      plantedDate,
      location,
      sunlightRequirement,
      notes,
    } = parsed.data;
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
    const parsed = UpdatePlantCareArgs.safeParse(args);
    if (!parsed.success) return { error: formatZodError(parsed.error) };
    const { plantId, lastWatered, lastFertilized, plantedDate, harvestDate } = parsed.data;
    const updated = db.updatePlantCareDates(plantId, {
      lastWatered,
      lastFertilized,
      plantedDate,
      harvestDate,
    });
    return updated ?? { error: `No plant with id ${plantId}` };
  }

  if (name === 'create_calendar_event') {
    const parsed = CalendarEventArgsSchema.safeParse(args);
    if (!parsed.success) return { error: formatZodError(parsed.error) };
    const { plantId, type, date, notes } = parsed.data;
    return db.createCalendarEvent({
      plantId,
      type,
      date,
      notes: notes || undefined,
    });
  }

  if (name === 'create_calendar_events_batch') {
    const parsed = CreateCalendarEventsBatchArgs.safeParse(args);
    if (!parsed.success) return { error: formatZodError(parsed.error) };
    return parsed.data.events.map((event) => {
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

export const buildSystemPrompt = async (db: ChatDatabase & SettingsDatabase): Promise<string> => {
  const runtime = getRuntimeConfig(db);
  const { preamble } = runtime.ai;
  const { location, hemisphere } = runtime.user;
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const parts: string[] = [preamble, `\nToday is ${today}.`];

  if (location) {
    const season = getCurrentSeason(hemisphere);
    parts.push(`User's location: ${location} (${hemisphere}ern hemisphere)`);
    parts.push(`Current season: ${season}`);
  }

  if (runtime.weather.apiKey && location) {
    const forecast = await getWeatherForecast(location, runtime.weather.apiKey);
    if (forecast) {
      parts.push(`\nWeather forecast:\n${forecast}`);
    }
  }

  // Cap memories included in the prompt — listChatMemories returns newest first.
  const memories = db.listChatMemories().slice(0, MEMORY_PROMPT_LIMIT);
  if (memories.length > 0) {
    parts.push('\nUseful context from previous conversations:');
    memories.forEach((m) => parts.push(`- ${m.content}`));
  }

  return parts.join('\n');
};

export const createAiService = (db: DatabaseWrapper & ChatDatabase & SettingsDatabase) => {
  // Resolve the Ollama client lazily on each call so the user can change the
  // base URL via PUT /api/settings without restarting the process.
  const ollamaClient = (): { client: Ollama; model: string } => {
    const runtime = getRuntimeConfig(db);
    if (runtime.aiBackend !== 'ollama') {
      logger.warn('Non-ollama AI backend selected but only ollama is implemented; using ollama', {
        configured: runtime.aiBackend,
      });
    }
    return {
      client: new Ollama({ host: runtime.ollama.baseUrl }),
      model: runtime.ollama.model,
    };
  };

  const chat = async (
    history: { role: 'user' | 'assistant'; content: string }[],
    systemPrompt: string,
  ): Promise<string> => {
    const messages: Message[] = [{ role: 'system', content: systemPrompt }, ...history];
    const { client, model } = ollamaClient();

    const tools = buildTools();
    logger.debug('ai.chat: sending initial request', {
      model,
      toolNames: tools.map((t) => t.function.name),
      messages,
    });
    let response = await client.chat({ model, messages, tools });
    logger.debug('ai.chat: initial response', {
      content: response.message.content,
      toolCalls: response.message.tool_calls,
    });

    const workingMessages: Message[] = [...messages];
    let turn = 0;

    // Tool calling loop — Ollama returns tool_calls until it's ready to respond.
    // Some models instead emit the call as JSON text in `content`; recover those
    // so we don't leak the raw blob back to the user.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const structured = response.message.tool_calls ?? [];
      const inline =
        structured.length === 0 ? parseInlineToolCall(response.message.content) : null;
      if (structured.length === 0 && !inline) break;

      turn += 1;

      const calls: RecoveredToolCall[] = inline
        ? [inline]
        : structured.map((c) => ({
            name: c.function.name,
            arguments: sanitiseToolArgs(c.function.arguments as Record<string, unknown>),
          }));

      if (inline) {
        logger.debug('ai.chat: recovered inline tool call from content', { turn, inline });
        workingMessages.push({
          role: 'assistant',
          content: '',
          tool_calls: [{ function: { name: inline.name, arguments: inline.arguments } }],
        });
      } else {
        workingMessages.push(response.message);
      }

      for (const call of calls) {
        let result: unknown;
        try {
          result = executeToolCall(call.name, call.arguments, db);
        } catch (err) {
          result = { error: (err as Error).message };
        }
        logger.debug('ai.chat: tool call executed', {
          turn,
          name: call.name,
          args: call.arguments,
          result,
        });
        workingMessages.push({ role: 'tool', content: JSON.stringify(result) });
      }

      logger.debug('ai.chat: sending follow-up request', {
        turn,
        messageCount: workingMessages.length,
        messages: workingMessages,
      });
      // eslint-disable-next-line no-await-in-loop
      response = await client.chat({
        model,
        messages: workingMessages,
        tools,
      });
      logger.debug('ai.chat: follow-up response', {
        turn,
        content: response.message.content,
        toolCalls: response.message.tool_calls,
      });
    }

    logger.debug('ai.chat: final assistant content', {
      turns: turn,
      content: response.message.content,
    });
    return response.message.content;
  };

  const summariseSession = async (
    history: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ summary: string; memories: string[] }> => {
    const conversationText = history.map((m) => `${m.role}: ${m.content}`).join('\n\n');
    const { client, model } = ollamaClient();

    const response = await client.chat({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that summarises gardening conversations. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: `Summarise this gardening conversation and extract useful facts worth remembering for future sessions.\n\nConversation:\n${conversationText}\n\nRespond with JSON only:\n{"summary": "2-3 sentence summary", "memories": ["fact1", "fact2"]}`,
        },
      ],
      format: 'json',
    });

    try {
      type SummaryPayload = { summary?: string; memories?: unknown[] };
      const parsed = JSON.parse(response.message.content) as SummaryPayload;
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        memories: Array.isArray(parsed.memories)
          ? parsed.memories.filter((m): m is string => typeof m === 'string')
          : [],
      };
    } catch (error) {
      logger.warn('Could not parse session summary as JSON, falling back to plain text', { error });
      return { summary: response.message.content, memories: [] };
    }
  };

  return { chat, summariseSession };
};
