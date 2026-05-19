import request from 'supertest';
import express, { Application } from 'express';
import { unlinkSync } from 'fs';
import { UpdateSettingsInputSchema } from '@sprout/shared/schemas/settings';
import { createSqliteDatabase } from './db/sqlite';
import { createUserService } from './services/user';
import { createAuthService } from './services/auth';
import { createSettingsService } from './services/settings';
import {
  createOnboardingService,
  OnboardingInputSchema,
  OnboardingAlreadyCompleteError,
} from './services/onboarding';

// Mirrors the onboarding/settings/auth slice of src/index.ts. The full
// createApp pulls in @orpc/openapi (an ESM-only dist) which the current
// ts-jest config can't transform, so the API test wires up only the routes
// it covers — the same workaround src/index.test.ts uses.
const buildTestApp = (database: ReturnType<typeof createSqliteDatabase>): Application => {
  const userService = createUserService(database);
  const authService = createAuthService(database);
  const settingsService = createSettingsService(database);
  const onboardingService = createOnboardingService(database, userService, settingsService);

  const app = express();
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

  app.get('/api/onboarding/status', async (_req, res) => {
    res.json(onboardingService.getStatus());
  });

  app.post('/api/onboarding', async (req, res) => {
    try {
      const input = OnboardingInputSchema.parse(req.body);
      const { user, settings } = onboardingService.complete(input);
      const token = await authService.generateToken(user.id);
      res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email, name: user.name },
        settings,
        token,
      });
    } catch (error) {
      if (error instanceof OnboardingAlreadyCompleteError) {
        res.status(409).json({ error: 'Onboarding has already been completed' });
        return;
      }
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.get('/api/settings', isAuthenticated, async (_req, res) => {
    const settings = settingsService.getSettings();
    if (!settings) {
      res.status(404).json({ error: 'Settings not configured' });
      return;
    }
    res.json(settings);
  });

  app.put('/api/settings', isAuthenticated, async (req, res) => {
    try {
      const input = UpdateSettingsInputSchema.parse(req.body);
      res.json(settingsService.saveSettings(input));
    } catch {
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  return app;
};

describe('Onboarding API', () => {
  let app: Application;
  let database: ReturnType<typeof createSqliteDatabase>;
  let dbFile: string;

  beforeEach(() => {
    dbFile = `${__dirname}/temp_onboarding_api_${Date.now()}_${Math.random()}.db`;
    database = createSqliteDatabase(dbFile);
    app = buildTestApp(database);
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
      aiBackend: 'local',
      localAiBaseUrl: 'http://localhost:11434/v1',
      localAiModel: 'llama3.2',
      hemisphere: 'southern',
      location: 'Perth, AU',
    },
  };

  it('GET /api/onboarding/status returns onboarded=false initially', async () => {
    const res = await request(app).get('/api/onboarding/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ onboarded: false });
  });

  it('POST /api/onboarding creates user, stores settings, and returns a token', async () => {
    const res = await request(app).post('/api/onboarding').send(validInput);
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('gardener');
    expect(res.body.settings.aiBackend).toBe('local');
    expect(typeof res.body.token).toBe('string');

    const status = await request(app).get('/api/onboarding/status');
    expect(status.body).toEqual({ onboarded: true });
  });

  it('POST /api/onboarding refuses to run twice', async () => {
    await request(app).post('/api/onboarding').send(validInput);
    const res = await request(app).post('/api/onboarding').send(validInput);
    expect(res.status).toBe(409);
  });

  it('POST /api/onboarding rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/api/onboarding')
      .send({ user: { username: 'x' }, settings: {} });
    expect(res.status).toBe(400);
  });

  it('GET /api/settings requires authentication', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });

  it('GET and PUT /api/settings work with the onboarding token', async () => {
    const onboard = await request(app).post('/api/onboarding').send(validInput);
    const { token } = onboard.body;

    const get = await request(app).get('/api/settings').set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.location).toBe('Perth, AU');

    const put = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...validInput.settings,
        location: 'Sydney, AU',
      });
    expect(put.status).toBe(200);
    expect(put.body.location).toBe('Sydney, AU');
  });
});
