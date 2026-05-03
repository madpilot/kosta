import request from 'supertest';
import express, { Application } from 'express';
import { unlinkSync } from 'fs';
import { CreatePlantInputSchema, UpdatePlantInputSchema } from './models/plant';
import { createPlantService } from './services/plants';
import { createSqliteDatabase } from './db/sqlite';

describe('API Endpoints', () => {
  let app: Application;
  let database: ReturnType<typeof createSqliteDatabase>;
  let dbFile: string;

  beforeEach(() => {
    dbFile = `${__dirname}/temp_index_test_${Date.now()}.db`;
    database = createSqliteDatabase(dbFile);
    const plantService = createPlantService(database);

    app = express();
    app.use(express.json());

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
  });

  afterEach(() => {
    database.close();
    try { unlinkSync(dbFile); } catch { /* ignore */ }
  });

  describe('GET /api/plants', () => {
    it('should return an empty array initially', async () => {
      const response = await request(app).get('/api/plants');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return all plants after creating them', async () => {
      await request(app).post('/api/plants').send({ name: 'Test Plant', species: 'Test Species' });
      const response = await request(app).get('/api/plants');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /api/plants/:id', () => {
    it('should return 404 for non-existent plant', async () => {
      const response = await request(app).get('/api/plants/does-not-exist');
      expect(response.status).toBe(404);
    });

    it('should return the plant when it exists', async () => {
      const created = await request(app).post('/api/plants').send({ name: 'Test Plant', species: 'Test Species' });
      const response = await request(app).get(`/api/plants/${created.body.id}`);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Plant');
    });
  });

  describe('POST /api/plants', () => {
    it('should create a new plant', async () => {
      const response = await request(app).post('/api/plants').send({ name: 'Test Plant', species: 'Test Species' });
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe('Test Plant');
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app).post('/api/plants').send({ name: '', species: 'Species' });
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/plants/:id', () => {
    it('should update an existing plant', async () => {
      const created = await request(app).post('/api/plants').send({ name: 'Test Plant', species: 'Test Species' });
      const response = await request(app).put(`/api/plants/${created.body.id}`).send({ name: 'Updated Plant' });
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Plant');
    });

    it('should return 404 for non-existent plant', async () => {
      const response = await request(app).put('/api/plants/does-not-exist').send({ name: 'Updated' });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/plants/:id', () => {
    it('should delete an existing plant', async () => {
      const created = await request(app).post('/api/plants').send({ name: 'Test Plant', species: 'Test Species' });
      const response = await request(app).delete(`/api/plants/${created.body.id}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent plant', async () => {
      const response = await request(app).delete('/api/plants/does-not-exist');
      expect(response.status).toBe(404);
    });
  });
});
