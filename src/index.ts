import express from 'express';
import { z } from 'zod';
import { createPlantService } from './services/plants';
import { createCalendarService } from './services/calendar';
import { createUserService } from './services/user';
import { createAuthService } from './services/auth';
import { createChatService } from './services/chat';
import { getDatabase, createSqliteDatabase } from './db/sqlite';
import {
  generateOpenApiSpec, CreatePlantInputSchema, UpdatePlantInputSchema, CreateCalendarEventInputSchema, UpdateCalendarEventInputSchema,
} from './openapi';
import { LoginInputSchema, ChangePasswordInputSchema } from './models/user';
import { SendMessageInputSchema } from './models/chat';
import { logger } from './utils/logger';

const app = express();
app.use(express.json());

const legacyDb = getDatabase();
const plantService = createPlantService(legacyDb);
const calendarService = createCalendarService(legacyDb);
const userService = createUserService(legacyDb);
const authService = createAuthService(legacyDb);

// createSqliteDatabase() shares the same SQLite singleton as getDatabase() but
// exposes the chat methods that the ChatDatabase interface requires.
const db = createSqliteDatabase();
const chatService = createChatService(db);

const isAuthenticated = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.substring(7);
  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  next();
};

app.get('/api/openapi.json', async (_req, res) => {
  const spec = await generateOpenApiSpec();
  res.json(spec);
});

app.get('/api/plants', async (req, res) => {
  try {
    const plants = plantService.listPlants();
    res.json(plants);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/plants/:id', async (req, res) => {
  try {
    const plant = plantService.getPlant(req.params.id);
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.json(plant);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/plants', async (req, res) => {
  try {
    const input = CreatePlantInputSchema.parse(req.body);
    const plant = plantService.createPlant(input);
    res.status(201).json(plant);
  } catch (error) {
    logger.warn('Invalid input', { method: req.method, path: req.path, error });
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.put('/api/plants/:id', async (req, res) => {
  try {
    const input = UpdatePlantInputSchema.parse(req.body);
    const plant = plantService.updatePlant(req.params.id, input);
    if (!plant) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.json(plant);
  } catch (error) {
    logger.warn('Invalid input', { method: req.method, path: req.path, error });
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.delete('/api/plants/:id', async (req, res) => {
  try {
    const deleted = plantService.deletePlant(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Plant not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar', async (req, res) => {
  try {
    const events = calendarService.getAllEvents();
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/today', async (req, res) => {
  try {
    const events = calendarService.getEventsForToday();
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/week', async (req, res) => {
  try {
    const events = calendarService.getEventsForWeek();
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/month', async (req, res) => {
  try {
    const events = calendarService.getEventsForMonth();
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/plants/:plantId', async (req, res) => {
  try {
    const { plantId } = req.params;
    const events = calendarService.getEventsByPlant(plantId);
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const events = calendarService.getEventsByDate(date);
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/upcoming', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 7;
    const events = calendarService.getUpcomingEvents(limit);
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/type/:type', async (req, res) => {
  try {
    const type = req.params.type as 'water' | 'fertilize' | 'harvest' | 'other';
    const events = calendarService.getEventsByType(type);
    res.json(events);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/daily-schedule/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const schedule = calendarService.getDailySchedule(date);
    res.json(schedule);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calendar', async (req, res) => {
  try {
    const input = CreateCalendarEventInputSchema.parse(req.body);
    const event = calendarService.createEvent(input);
    res.status(201).json(event);
  } catch (error) {
    logger.warn('Invalid input', { method: req.method, path: req.path, error });
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.put('/api/calendar/:id', async (req, res) => {
  try {
    const input = UpdateCalendarEventInputSchema.parse(req.body);
    const event = calendarService.updateEvent(req.params.id, input);
    if (!event) {
      res.status(404).json({ error: 'Calendar event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    logger.warn('Invalid input', { method: req.method, path: req.path, error });
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.delete('/api/calendar/:id', async (req, res) => {
  try {
    const deleted = calendarService.deleteEvent(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Calendar event not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/calendar/:id/complete', async (req, res) => {
  try {
    const completed = calendarService.completeEvent(req.params.id);
    if (!completed) {
      res.status(404).json({ error: 'Calendar event not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const input = LoginInputSchema.parse(req.body);
    const user = userService.authenticateUser(input);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = authService.generateToken(user.id);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid input', details: error.message });
  }
});

app.post('/api/auth/password-reset', async (req, res) => {
  try {
    const input = z.object({
      email: z.string().email(),
    }).parse(req.body);

    const user = userService.initiatePasswordReset(input.email);
    if (!user) {
      res.status(404).json({ error: 'User not found for this email' });
      return;
    }

    res.json({ success: true, message: 'Password reset has been sent to your email' });
  } catch (error) {
    logger.error('Password reset failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Failed to initiate password reset' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const input = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8),
    }).parse(req.body);

    const user = userService.resetPassword(input.token, input.newPassword);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    logger.warn('Invalid input', { method: req.method, path: req.path, error });
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
  try {
    const input = ChangePasswordInputSchema.parse(req.body);
    const success = userService.changePassword(req.userId, input);

    if (!success) {
      return res.status(401).json({ error: 'Invalid old password' });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    logger.warn('Invalid input', { method: req.method, path: req.path, error });
    res.status(400).json({ error: 'Invalid input' });
  }
});

app.get('/api/user/profile', isAuthenticated, async (req, res) => {
  try {
    const user = userService.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Chat ---

app.post('/api/chat/sessions', async (req, res) => {
  try {
    const session = chatService.createSession();
    res.status(201).json(session);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat/sessions', async (req, res) => {
  try {
    const sessions = chatService.listSessions();
    res.json(sessions);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat/sessions/:id', async (req, res) => {
  try {
    const session = chatService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const messages = db.getChatMessages(req.params.id);
    res.json({ ...session, messages });
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/chat/sessions/:id', async (req, res) => {
  try {
    const deleted = chatService.deleteSession(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat/sessions/:id/messages', async (req, res) => {
  try {
    const input = SendMessageInputSchema.parse(req.body);
    const result = await chatService.sendMessage(req.params.id, input.content);
    res.json(result);
  } catch (err) {
    if ((err as Error).message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat/sessions/:id/end', async (req, res) => {
  try {
    const result = await chatService.endSession(req.params.id);
    res.json(result);
  } catch (err) {
    if ((err as Error).message === 'Session not found') {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/chat/memories', async (req, res) => {
  try {
    const memories = chatService.listMemories();
    res.json(memories);
  } catch (error) {
    logger.error('Request failed', { method: req.method, path: req.path, error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4th arg is required for Express to recognise this as an error-handling middleware.
app.use((
  err: unknown,
  req: express.Request,
  res: express.Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: express.NextFunction,
) => {
  logger.error('Unhandled request error', {
    method: req.method, path: req.path, error: err,
  });
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info('Server started', { host: HOST, port: PORT });
});

export default app;
