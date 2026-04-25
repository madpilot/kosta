import request from 'supertest';
import express, { Application } from 'express';
import openApiSpec from '../openapi';
import { initSqlite, getDatabase } from '../db/sqlite';

describe('API Endpoints', () => {
  let app: Application;

  beforeEach(() => {
    const db = getDatabase();
    const { createPlantService } = require('../services/plants');
    const plantService = createPlantService(db);

    app = express();
    app.use(express.json());

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
        const input = (await import('../openapi')).CreatePlantInputSchema.parse(req.body);
        const plant = plantService.createPlant(input);
        res.status(201).json(plant);
      } catch {
        res.status(400).json({ error: 'Invalid input' });
      }
    });

    app.put('/api/plants/:id', async (req, res) => {
      try {
        const input = (await import('../openapi')).UpdatePlantInputSchema.parse(req.body);
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

  describe('GET /api/openapi.json', () => {
    it('should return the OpenAPI spec', async () => {
      const response = await request(app).get('/api/openapi.json');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });
  });

  describe('GET /api/plants', () => {
    it('should return an empty array initially', async () => {
      const response = await request(app).get('/api/plants');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return all plants after creating them', async () => {
      const createResponse = await request(app)
        .post('/api/plants')
        .send({
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe('Test Plant');

      const getAllResponse = await request(app).get('/api/plants');
      expect(getAllResponse.status).toBe(200);
      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0].name).toBe('Test Plant');
    });
  });

  describe('GET /api/plants/:id', () => {
    it('should return 404 for non-existent plant', async () => {
      const response = await request(app).get('/api/plants/does-not-exist');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Plant not found');
    });

    it('should return the plant when it exists', async () => {
      const createResponse = await request(app)
        .post('/api/plants')
        .send({
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
        });

      expect(createResponse.status).toBe(201);

      const plantId = createResponse.body.id;
      const getResponse = await request(app).get(`/api/plants/${plantId}`.replace('http://', '').replace('https://', ''));

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toBe(createResponse.body.id);
      expect(getResponse.body.name).toBe('Test Plant');
    });
  });

  describe('POST /api/plants', () => {
    it('should create a new plant', async () => {
      const plantData = {
        name: 'Test Plant',
        species: 'Test Species',
        location: 'Test Location',
        plantedDate: new Date().toISOString(),
      };

      const response = await request(app)
        .post('/api/plants')
        .send(plantData);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(plantData.name);
      expect(response.body.species).toBe(plantData.species);
      expect(response.body.location).toBe(plantData.location);
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/plants')
        .send({
          name: '',
          species: 'Test Species',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('PUT /api/plants/:id', () => {
    it('should update an existing plant', async () => {
      const createResponse = await request(app)
        .post('/api/plants')
        .send({
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
        });

      expect(createResponse.status).toBe(201);

      const plantId = createResponse.body.id;
      const updateResponse = await request(app)
        .put(`/api/plants/${plantId}`.replace('http://', '').replace('https://', ''))
        .send({
          name: 'Updated Plant',
          species: 'Updated Species',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe('Updated Plant');
      expect(updateResponse.body.species).toBe('Updated Species');
    });

    it('should return 404 for non-existent plant', async () => {
      const response = await request(app)
        .put('/api/plants/does-not-exist' .replace('http://', '').replace('https://', ''))
        .send({
          name: 'Updated Plant',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Plant not found');
    });
  });

  describe('DELETE /api/plants/:id', () => {
    it('should delete an existing plant', async () => {
      const createResponse = await request(app)
        .post('/api/plants')
        .send({
          name: 'Test Plant',
          species: 'Test Species',
          location: 'Test Location',
          plantedDate: new Date().toISOString(),
        });

      expect(createResponse.status).toBe(201);

      const plantId = createResponse.body.id;
      const deleteResponse = await request(app)
        .delete(`/api/plants/${plantId}`.replace('http://', '').replace('https://', ''));

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);

      const getResponse = await request(app).get('/api/plants');
      expect(getResponse.body).toHaveLength(0);
    });

    it('should return 404 for non-existent plant', async () => {
      const response = await request(app)
        .delete('/api/plants/does-not-exist' .replace('http://', '').replace('https://', ''));

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Plant not found');
    });
  });
});