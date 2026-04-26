import express from 'express';
import { createPlantService } from './services/plants';
import { createCalendarService } from './services/calendar';
import { createUserService } from './services/user';
import { createAuthService } from './services/auth';
import { getDatabase } from './db/sqlite';
import { openApiSpec, CreatePlantInputSchema, UpdatePlantInputSchema, CreateCalendarEventInputSchema, UpdateCalendarEventInputSchema } from './openapi';
import { UserSchema, LoginInputSchema, ChangePasswordInputSchema } from './models/user';

const app = express();
app.use(express.json());

const db = getDatabase();
const plantService = createPlantService(db);
const calendarService = createCalendarService(db);
const userService = createUserService(db);
const authService = createAuthService(db);

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

app.get('/api/openapi.json', (_req, res) => {
  res.json(openApiSpec);
});

app.get('/api/plants', async (_req, res) => {
  try {
    const plants = plantService.listPlants();
    res.json(plants);
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/plants', async (req, res) => {
  try {
    const input = CreatePlantInputSchema.parse(req.body);
    const plant = plantService.createPlant(input);
    res.status(201).json(plant);
  } catch {
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
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar', async (_req, res) => {
  try {
    const events = calendarService.getAllEvents();
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/today', async (_req, res) => {
  try {
    const events = calendarService.getEventsForToday();
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/week', async (_req, res) => {
  try {
    const events = calendarService.getEventsForWeek();
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/month', async (_req, res) => {
  try {
    const events = calendarService.getEventsForMonth();
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/plants/:plantId', async (req, res) => {
  try {
    const plantId = req.params.plantId;
    const events = calendarService.getEventsByPlant(plantId);
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/date/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const events = calendarService.getEventsByDate(date);
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/upcoming', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 7;
    const events = calendarService.getUpcomingEvents(limit);
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/type/:type', async (req, res) => {
  try {
    const type = req.params.type as 'water' | 'fertilize' | 'harvest' | 'other';
    const events = calendarService.getEventsByType(type);
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/calendar/daily-schedule/:date', async (req, res) => {
  try {
    const date = req.params.date;
    const schedule = calendarService.getDailySchedule(date);
    res.json(schedule);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/calendar', async (req, res) => {
  try {
    const input = CreateCalendarEventInputSchema.parse(req.body);
    const event = calendarService.createEvent(input);
    res.status(201).json(event);
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
    }).parse(req.body,);

    const user = userService.initiatePasswordReset(input.email);
    if (!user) {
      res.status(404).json({ error: 'User not found for this email' });
      return;
    }

    res.json({ success: true, message: 'Password reset has been sent to your email' });
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

export default app;