import express from 'express';
import { createPlantService } from './services/plants';
import { createCalendarService } from './services/calendar';
import { getDatabase } from './db/sqlite';
import { openApiSpec, CreatePlantInputSchema, UpdatePlantInputSchema, CreateCalendarEventInputSchema, UpdateCalendarEventInputSchema } from './openapi';

const app = express();
app.use(express.json());

const db = getDatabase();
const plantService = createPlantService(db);
const calendarService = createCalendarService(db);

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

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

export default app;