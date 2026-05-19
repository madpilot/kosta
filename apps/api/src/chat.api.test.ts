import request from 'supertest';
import express, { Application } from 'express';
import { unlinkSync } from 'fs';
import { SendMessageInputSchema } from '@sprout/shared/schemas/chat';
import { createSqliteDatabase } from './db/sqlite';
import { createAuthService } from './services/auth';
import { createUserService } from './services/user';
import { createChatService } from './services/chat';

const chatMock = jest.fn();

// Mock the global fetch used by the OpenAI-compatible client in ai.ts
global.fetch = jest.fn();

jest.mock('./services/weather', () => ({
  getWeatherForecast: jest.fn().mockResolvedValue(null),
}));

// Mirrors the chat slice of src/index.ts. The full createApp pulls in
// @orpc/openapi (an ESM-only dist) which ts-jest can't transform, so the
// chat API test wires up only the routes it covers — the same workaround
// the onboarding API test uses.
const buildTestApp = async (database: ReturnType<typeof createSqliteDatabase>) => {
  const authService = createAuthService(database);
  const userService = createUserService(database);
  const chatService = createChatService(database);

  const app: Application = express();
  app.use(express.json());

  const isAuthenticated: express.RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const decoded = await authService.verifyToken(authHeader.substring(7));
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    next();
  };

  app.post('/api/chat/sessions', isAuthenticated, (_req, res) => {
    res.status(201).json(chatService.createSession());
  });

  app.get('/api/chat/sessions', isAuthenticated, (_req, res) => {
    res.json(chatService.listSessions());
  });

  app.get('/api/chat/sessions/:id', isAuthenticated, (req, res) => {
    const session = chatService.getSession(req.params.id as string);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json({ ...session, messages: database.getChatMessages(req.params.id as string) });
  });

  app.delete('/api/chat/sessions/:id', isAuthenticated, (req, res) => {
    const deleted = chatService.deleteSession(req.params.id as string);
    if (!deleted) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json({ success: true });
  });

  app.post('/api/chat/sessions/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const input = SendMessageInputSchema.parse(req.body);
      const result = await chatService.sendMessage(req.params.id as string, input.content);
      res.json(result);
    } catch (err) {
      if ((err as Error).message === 'Session not found') {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.get('/api/chat/memories', isAuthenticated, (_req, res) => {
    res.json(chatService.listMemories());
  });

  const user = userService.createUser({
    username: 'gardener',
    email: 'gardener@example.com',
    name: 'Gardener',
    password: 'correcthorsebatterystaple',
  });
  const token = await authService.generateToken(user.id);

  return { app, token };
};

describe('Chat API', () => {
  let dbFile: string;
  let database: ReturnType<typeof createSqliteDatabase>;

  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
    dbFile = `${__dirname}/temp_chat_api_${Date.now()}_${Math.random()}.db`;
    database = createSqliteDatabase(dbFile);
  });

  afterEach(() => {
    database.close();
    ['', '-wal', '-shm'].forEach((suffix) => {
      try {
        unlinkSync(`${dbFile}${suffix}`);
      } catch {
        /* ignore */
      }
    });
  });

  it('requires authentication', async () => {
    const { app } = await buildTestApp(database);
    const res = await request(app).get('/api/chat/sessions');
    expect(res.status).toBe(401);
  });

  it('creates, lists, and deletes a session', async () => {
    const { app, token } = await buildTestApp(database);

    const create = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(create.status).toBe(201);
    expect(typeof create.body.id).toBe('string');

    const list = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(create.body.id);

    const del = await request(app)
      .delete(`/api/chat/sessions/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ success: true });

    const after = await request(app)
      .get('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(after.body).toHaveLength(0);
  });

  it('sends a message and returns the assistant reply', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: 'Nice — basil likes warmth.',
              tool_calls: undefined,
            },
          },
        ],
      }),
    });

    const { app, token } = await buildTestApp(database);
    const session = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/api/chat/sessions/${session.body.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'I just planted basil.' });

    expect(res.status).toBe(200);
    expect(res.body.userMessage.role).toBe('user');
    expect(res.body.userMessage.content).toBe('I just planted basil.');
    expect(res.body.assistantMessage.role).toBe('assistant');
    expect(res.body.assistantMessage.content).toBe('Nice — basil likes warmth.');

    const fetched = await request(app)
      .get(`/api/chat/sessions/${session.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    const visible = fetched.body.messages.filter((m: { role: string }) => m.role !== 'system');
    expect(visible).toHaveLength(2);
  });

  it('rejects empty messages with 400', async () => {
    const { app, token } = await buildTestApp(database);
    const session = await request(app)
      .post('/api/chat/sessions')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .post(`/api/chat/sessions/${session.body.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('returns 404 when sending a message to a missing session', async () => {
    const { app, token } = await buildTestApp(database);
    const res = await request(app)
      .post('/api/chat/sessions/00000000-0000-0000-0000-000000000000/messages')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello' });
    expect(res.status).toBe(404);
  });
});
