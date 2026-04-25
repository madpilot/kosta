"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePlantInputSchema = exports.CreatePlantInputSchema = exports.PlantSchema = void 0;
const zod_1 = require("zod");
exports.PlantSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(255),
    species: zod_1.z.string().min(1).max(255),
    location: zod_1.z.string().max(255).optional(),
    plantedDate: zod_1.z.string().datetime().optional(),
    lastWatered: zod_1.z.string().datetime().optional(),
    wateringFrequency: zod_1.z.number().int().min(1).optional(),
    lastFertilized: zod_1.z.string().datetime().optional(),
    fertilizingFrequency: zod_1.z.number().int().min(1).optional(),
    notes: zod_1.z.string().optional(),
    sunlightRequirement: zod_1.z.enum(['full-sun', 'partial-shade', 'shade']).optional(),
    soilType: zod_1.z.string().max(100).optional(),
    harvestDate: zod_1.z.string().datetime().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
exports.CreatePlantInputSchema = exports.PlantSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
}).partial({
    plantedDate: true,
    lastWatered: true,
    lastFertilized: true,
    harvestDate: true,
});
exports.UpdatePlantInputSchema = exports.CreatePlantInputSchema.partial();
//# sourceMappingURL=plant.js.map