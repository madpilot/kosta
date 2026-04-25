"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlantService = void 0;
const plant_1 = require("../models/plant");
const createPlantService = (db) => ({
    listPlants() {
        return db.getAllPlants();
    },
    getPlant(id) {
        return db.getPlantById(id);
    },
    createPlant(input) {
        const validInput = plant_1.CreatePlantInputSchema.parse(input);
        return db.createPlant(validInput);
    },
    updatePlant(id, input) {
        plant_1.UpdatePlantInputSchema.parse(input);
        return db.updatePlant(id, input);
    },
    deletePlant(id) {
        return db.deletePlant(id);
    },
});
exports.createPlantService = createPlantService;
exports.default = exports.createPlantService;
//# sourceMappingURL=plants.js.map