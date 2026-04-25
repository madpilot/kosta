"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const plants_1 = require("./services/plants");
const sqlite_1 = require("./db/sqlite");
const openapi_1 = require("./openapi");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const db = (0, sqlite_1.getDatabase)();
const plantService = (0, plants_1.createPlantService)(db);
app.get('/api/openapi.json', (_req, res) => {
    res.json(openapi_1.openApiSpec);
});
app.get('/api/plants', async (_req, res) => {
    try {
        const plants = plantService.listPlants();
        res.json(plants);
    }
    catch {
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
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/plants', async (req, res) => {
    try {
        const input = openapi_1.CreatePlantInputSchema.parse(req.body);
        const plant = plantService.createPlant(input);
        res.status(201).json(plant);
    }
    catch {
        res.status(400).json({ error: 'Invalid input' });
    }
});
app.put('/api/plants/:id', async (req, res) => {
    try {
        const input = openapi_1.UpdatePlantInputSchema.parse(req.body);
        const plant = plantService.updatePlant(req.params.id, input);
        if (!plant) {
            res.status(404).json({ error: 'Plant not found' });
            return;
        }
        res.json(plant);
    }
    catch {
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
    }
    catch {
        res.status(500).json({ error: 'Internal server error' });
    }
});
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map