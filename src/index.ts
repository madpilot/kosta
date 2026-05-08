import express from 'express';
import { z } from 'zod';
import type { Database } from './db/index';
import { createPlantService } from './services/plants';
import { createCalendarService } from './services/calendar';
import { createUserService } from './services/user';
import { createAuthService } from './services/auth';
import { createChatService } from './services/chat';
import { createSqliteDatabase } from './db/sqlite';
import {
  generateOpenApiSpec,
  CreatePlantInputSchema,
  UpdatePlantInputSchema,
  CreateCalendarEventInputSchema,
  UpdateCalendarEventInputSchema,
} from './openapi';
import { CreateUserInputSchema, LoginInputSchema, ChangePasswordInputSchema } from './models/user';
import { SendMessageInputSchema } from './models/chat';
import { logger } from './utils/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export const createApp = (db: Database) => {
  const plantService = createPlantService(db);
  const calendarService = createCalendarService(db);
  const userService = createUserService(db);
  const authService = createAuthService();
  const chatService = createChatService(db);

  const app = express();
  app.use(express.json());

  const isAuthenticated = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.userId = decoded.userId;
    next();
  };

  app.get('/api/openapi.json', async (_req, res) => {
    const spec = await generateOpenApiSpec();
    res.json(spec);
  });

  // --- Plants (auth required) ---

  app.get('/api/plants', isAuthenticated, async (req, res) => {
    try {
      const plants = plantService.listPlants(req.userId);
      res.json(plants);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/plants/:id', isAuthenticated, async (req, res) => {
    try {
      const plant = plantService.getPlant(req.userId, req.params.id as string);
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

  app.post('/api/plants', isAuthenticated, async (req, res) => {
    try {
      const input = CreatePlantInputSchema.parse(req.body);
      const plant = plantService.createPlant(req.userId, input);
      res.status(201).json(plant);
    } catch (error) {
      logger.warn('Invalid input', { method: req.method, path: req.path, error });
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.put('/api/plants/:id', isAuthenticated, async (req, res) => {
    try {
      const input = UpdatePlantInputSchema.parse(req.body);
      const plant = plantService.updatePlant(req.userId, req.params.id as string, input);
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

  app.delete('/api/plants/:id', isAuthenticated, async (req, res) => {
    try {
      const deleted = plantService.deletePlant(req.userId, req.params.id as string);
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

  // --- Calendar (auth required) ---

  app.get('/api/calendar', isAuthenticated, async (req, res) => {
    try {
      const events = calendarService.getAllEvents(req.userId);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/today', isAuthenticated, async (req, res) => {
    try {
      const events = calendarService.getEventsForToday(req.userId);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/week', isAuthenticated, async (req, res) => {
    try {
      const events = calendarService.getEventsForWeek(req.userId);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/month', isAuthenticated, async (req, res) => {
    try {
      const events = calendarService.getEventsForMonth(req.userId);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/plants/:plantId', isAuthenticated, async (req, res) => {
    try {
      const plantId = req.params.plantId as string;
      const events = calendarService.getEventsByPlant(req.userId, plantId);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/date/:date', isAuthenticated, async (req, res) => {
    try {
      const date = req.params.date as string;
      const events = calendarService.getEventsByDate(req.userId, date);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/upcoming', isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 7;
      const events = calendarService.getUpcomingEvents(req.userId, limit);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/type/:type', isAuthenticated, async (req, res) => {
    try {
      const type = req.params.type as unknown as 'water' | 'fertilize' | 'harvest' | 'other';
      const events = calendarService.getEventsByType(req.userId, type);
      res.json(events);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calendar/daily-schedule/:date', isAuthenticated, async (req, res) => {
    try {
      const date = req.params.date as string;
      const schedule = calendarService.getDailySchedule(req.userId, date);
      res.json(schedule);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/calendar', isAuthenticated, async (req, res) => {
    try {
      const input = CreateCalendarEventInputSchema.parse(req.body);
      const event = calendarService.createEvent(req.userId, input);
      res.status(201).json(event);
    } catch (error) {
      logger.warn('Invalid input', { method: req.method, path: req.path, error });
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.put('/api/calendar/:id', isAuthenticated, async (req, res) => {
    try {
      const input = UpdateCalendarEventInputSchema.parse(req.body);
      const event = calendarService.updateEvent(req.userId, req.params.id as string, input);
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

  app.delete('/api/calendar/:id', isAuthenticated, async (req, res) => {
    try {
      const deleted = calendarService.deleteEvent(req.userId, req.params.id as string);
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

  app.patch('/api/calendar/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const completed = calendarService.completeEvent(req.userId, req.params.id as string);
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

  // --- Auth ---

  app.post('/api/auth/register', async (req, res) => {
    try {
      const input = CreateUserInputSchema.parse(req.body);
      const user = userService.createUser(input);
      const token = await authService.generateToken(user.id);
      res.status(201).json({
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
      logger.warn('Invalid input', { method: req.method, path: req.path, error });
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const input = LoginInputSchema.parse(req.body);
      const user = userService.authenticateUser(input);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = await authService.generateToken(user.id);
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
      logger.warn('Invalid input', { method: req.method, path: req.path, error });
      res.status(400).json({ error: 'Invalid input' });
    }
  });

  app.post('/api/auth/password-reset', async (req, res) => {
    try {
      const input = z.object({ email: z.string().email() }).parse(req.body);
      userService.initiatePasswordReset(input.email);
    } catch (error) {
      // Validation failures fall through to the same response — never reveal
      // whether the email is registered.
      logger.warn('Password reset input rejected', {
        method: req.method,
        path: req.path,
        error,
      });
    }
    // Always 200, regardless of whether the email matched a user, to prevent
    // account enumeration.
    res.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const input = z
        .object({
          token: z.string().min(1),
          newPassword: z.string().min(8),
        })
        .parse(req.body);

      const user = userService.resetPassword(input.token, input.newPassword);
      if (!user) {
        res.status(401).json({ error: 'Invalid or expired reset token' });
        return;
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
        res.status(401).json({ error: 'Invalid old password' });
        return;
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
        res.status(404).json({ error: 'User not found' });
        return;
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

  // --- Chat (auth required) ---

  app.post('/api/chat/sessions', isAuthenticated, async (req, res) => {
    try {
      const session = chatService.createSession(req.userId);
      res.status(201).json(session);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chat/sessions', isAuthenticated, async (req, res) => {
    try {
      const sessions = chatService.listSessions(req.userId);
      res.json(sessions);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chat/sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const session = chatService.getSession(req.userId, req.params.id as string);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      const messages = db.getChatMessages(req.userId, req.params.id as string);
      res.json({ ...session, messages });
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/chat/sessions/:id', isAuthenticated, async (req, res) => {
    try {
      const deleted = chatService.deleteSession(req.userId, req.params.id as string);
      if (!deleted) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/chat/sessions/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const input = SendMessageInputSchema.parse(req.body);
      const result = await chatService.sendMessage(
        req.userId,
        req.params.id as string,
        input.content,
      );
      res.json(result);
    } catch (err) {
      if ((err as Error).message === 'Session not found') {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/chat/sessions/:id/end', isAuthenticated, async (req, res) => {
    try {
      const result = await chatService.endSession(req.userId, req.params.id as string);
      res.json(result);
    } catch (err) {
      if ((err as Error).message === 'Session not found') {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/chat/memories', isAuthenticated, async (req, res) => {
    try {
      const memories = chatService.listMemories(req.userId);
      res.json(memories);
    } catch (error) {
      logger.error('Request failed', { method: req.method, path: req.path, error });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 4th arg is required for Express to recognise this as an error-handling middleware.
  app.use(
    (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled request error', {
        method: req.method,
        path: req.path,
        error: err,
      });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    },
  );

  return app;
};

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// JEST_WORKER_ID is set when running under Jest — guard against booting a real
// server during tests that import this module.
if (process.env.JEST_WORKER_ID === undefined) {
  const db = createSqliteDatabase();
  const app = createApp(db);
  app.listen(PORT, HOST, () => {
    logger.info('Server started', { host: HOST, port: PORT });
  });
}
