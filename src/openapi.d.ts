import { z } from 'zod';
declare const PlantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    species: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    plantedDate: z.ZodOptional<z.ZodString>;
    lastWatered: z.ZodOptional<z.ZodString>;
    wateringFrequency: z.ZodOptional<z.ZodNumber>;
    lastFertilized: z.ZodOptional<z.ZodString>;
    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
    soilType: z.ZodOptional<z.ZodString>;
    harvestDate: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    species: string;
    createdAt: string;
    updatedAt: string;
    location?: string | undefined;
    plantedDate?: string | undefined;
    lastWatered?: string | undefined;
    wateringFrequency?: number | undefined;
    lastFertilized?: string | undefined;
    fertilizingFrequency?: number | undefined;
    notes?: string | undefined;
    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
    soilType?: string | undefined;
    harvestDate?: string | undefined;
}, {
    id: string;
    name: string;
    species: string;
    createdAt: string;
    updatedAt: string;
    location?: string | undefined;
    plantedDate?: string | undefined;
    lastWatered?: string | undefined;
    wateringFrequency?: number | undefined;
    lastFertilized?: string | undefined;
    fertilizingFrequency?: number | undefined;
    notes?: string | undefined;
    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
    soilType?: string | undefined;
    harvestDate?: string | undefined;
}>;
declare const CreatePlantInputSchema: z.ZodObject<{
    name: z.ZodString;
    species: z.ZodString;
    location: z.ZodOptional<z.ZodString>;
    plantedDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lastWatered: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    wateringFrequency: z.ZodOptional<z.ZodNumber>;
    lastFertilized: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
    soilType: z.ZodOptional<z.ZodString>;
    harvestDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    species: string;
    location?: string | undefined;
    plantedDate?: string | undefined;
    lastWatered?: string | undefined;
    wateringFrequency?: number | undefined;
    lastFertilized?: string | undefined;
    fertilizingFrequency?: number | undefined;
    notes?: string | undefined;
    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
    soilType?: string | undefined;
    harvestDate?: string | undefined;
}, {
    name: string;
    species: string;
    location?: string | undefined;
    plantedDate?: string | undefined;
    lastWatered?: string | undefined;
    wateringFrequency?: number | undefined;
    lastFertilized?: string | undefined;
    fertilizingFrequency?: number | undefined;
    notes?: string | undefined;
    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
    soilType?: string | undefined;
    harvestDate?: string | undefined;
}>;
declare const UpdatePlantInputSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    species: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    plantedDate: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
    lastWatered: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
    wateringFrequency: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    lastFertilized: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
    fertilizingFrequency: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sunlightRequirement: z.ZodOptional<z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>>;
    soilType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    harvestDate: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    species?: string | undefined;
    location?: string | undefined;
    plantedDate?: string | undefined;
    lastWatered?: string | undefined;
    wateringFrequency?: number | undefined;
    lastFertilized?: string | undefined;
    fertilizingFrequency?: number | undefined;
    notes?: string | undefined;
    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
    soilType?: string | undefined;
    harvestDate?: string | undefined;
}, {
    name?: string | undefined;
    species?: string | undefined;
    location?: string | undefined;
    plantedDate?: string | undefined;
    lastWatered?: string | undefined;
    wateringFrequency?: number | undefined;
    lastFertilized?: string | undefined;
    fertilizingFrequency?: number | undefined;
    notes?: string | undefined;
    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
    soilType?: string | undefined;
    harvestDate?: string | undefined;
}>;
export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        description: string;
        version: string;
    };
    servers: {
        url: string;
        description: string;
    }[];
    paths: {
        '/api/plants': {
            get: {
                summary: string;
                description: string;
                operationId: string;
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    items: z.ZodObject<{
                                        id: z.ZodString;
                                        name: z.ZodString;
                                        species: z.ZodString;
                                        location: z.ZodOptional<z.ZodString>;
                                        plantedDate: z.ZodOptional<z.ZodString>;
                                        lastWatered: z.ZodOptional<z.ZodString>;
                                        wateringFrequency: z.ZodOptional<z.ZodNumber>;
                                        lastFertilized: z.ZodOptional<z.ZodString>;
                                        fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
                                        notes: z.ZodOptional<z.ZodString>;
                                        sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
                                        soilType: z.ZodOptional<z.ZodString>;
                                        harvestDate: z.ZodOptional<z.ZodString>;
                                        createdAt: z.ZodString;
                                        updatedAt: z.ZodString;
                                    }, "strip", z.ZodTypeAny, {
                                        id: string;
                                        name: string;
                                        species: string;
                                        createdAt: string;
                                        updatedAt: string;
                                        location?: string | undefined;
                                        plantedDate?: string | undefined;
                                        lastWatered?: string | undefined;
                                        wateringFrequency?: number | undefined;
                                        lastFertilized?: string | undefined;
                                        fertilizingFrequency?: number | undefined;
                                        notes?: string | undefined;
                                        sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                        soilType?: string | undefined;
                                        harvestDate?: string | undefined;
                                    }, {
                                        id: string;
                                        name: string;
                                        species: string;
                                        createdAt: string;
                                        updatedAt: string;
                                        location?: string | undefined;
                                        plantedDate?: string | undefined;
                                        lastWatered?: string | undefined;
                                        wateringFrequency?: number | undefined;
                                        lastFertilized?: string | undefined;
                                        fertilizingFrequency?: number | undefined;
                                        notes?: string | undefined;
                                        sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                        soilType?: string | undefined;
                                        harvestDate?: string | undefined;
                                    }>;
                                };
                            };
                        };
                    };
                };
            };
            post: {
                summary: string;
                description: string;
                operationId: string;
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: z.ZodObject<{
                                name: z.ZodString;
                                species: z.ZodString;
                                location: z.ZodOptional<z.ZodString>;
                                plantedDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                                lastWatered: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                                wateringFrequency: z.ZodOptional<z.ZodNumber>;
                                lastFertilized: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                                fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
                                notes: z.ZodOptional<z.ZodString>;
                                sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
                                soilType: z.ZodOptional<z.ZodString>;
                                harvestDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                            }, "strip", z.ZodTypeAny, {
                                name: string;
                                species: string;
                                location?: string | undefined;
                                plantedDate?: string | undefined;
                                lastWatered?: string | undefined;
                                wateringFrequency?: number | undefined;
                                lastFertilized?: string | undefined;
                                fertilizingFrequency?: number | undefined;
                                notes?: string | undefined;
                                sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                soilType?: string | undefined;
                                harvestDate?: string | undefined;
                            }, {
                                name: string;
                                species: string;
                                location?: string | undefined;
                                plantedDate?: string | undefined;
                                lastWatered?: string | undefined;
                                wateringFrequency?: number | undefined;
                                lastFertilized?: string | undefined;
                                fertilizingFrequency?: number | undefined;
                                notes?: string | undefined;
                                sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                soilType?: string | undefined;
                                harvestDate?: string | undefined;
                            }>;
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: z.ZodObject<{
                                    id: z.ZodString;
                                    name: z.ZodString;
                                    species: z.ZodString;
                                    location: z.ZodOptional<z.ZodString>;
                                    plantedDate: z.ZodOptional<z.ZodString>;
                                    lastWatered: z.ZodOptional<z.ZodString>;
                                    wateringFrequency: z.ZodOptional<z.ZodNumber>;
                                    lastFertilized: z.ZodOptional<z.ZodString>;
                                    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
                                    notes: z.ZodOptional<z.ZodString>;
                                    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
                                    soilType: z.ZodOptional<z.ZodString>;
                                    harvestDate: z.ZodOptional<z.ZodString>;
                                    createdAt: z.ZodString;
                                    updatedAt: z.ZodString;
                                }, "strip", z.ZodTypeAny, {
                                    id: string;
                                    name: string;
                                    species: string;
                                    createdAt: string;
                                    updatedAt: string;
                                    location?: string | undefined;
                                    plantedDate?: string | undefined;
                                    lastWatered?: string | undefined;
                                    wateringFrequency?: number | undefined;
                                    lastFertilized?: string | undefined;
                                    fertilizingFrequency?: number | undefined;
                                    notes?: string | undefined;
                                    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                    soilType?: string | undefined;
                                    harvestDate?: string | undefined;
                                }, {
                                    id: string;
                                    name: string;
                                    species: string;
                                    createdAt: string;
                                    updatedAt: string;
                                    location?: string | undefined;
                                    plantedDate?: string | undefined;
                                    lastWatered?: string | undefined;
                                    wateringFrequency?: number | undefined;
                                    lastFertilized?: string | undefined;
                                    fertilizingFrequency?: number | undefined;
                                    notes?: string | undefined;
                                    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                    soilType?: string | undefined;
                                    harvestDate?: string | undefined;
                                }>;
                            };
                        };
                    };
                    400: {
                        description: string;
                    };
                };
            };
        };
        '/api/plants/{id}': {
            get: {
                summary: string;
                description: string;
                operationId: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: z.ZodObject<{
                                    id: z.ZodString;
                                    name: z.ZodString;
                                    species: z.ZodString;
                                    location: z.ZodOptional<z.ZodString>;
                                    plantedDate: z.ZodOptional<z.ZodString>;
                                    lastWatered: z.ZodOptional<z.ZodString>;
                                    wateringFrequency: z.ZodOptional<z.ZodNumber>;
                                    lastFertilized: z.ZodOptional<z.ZodString>;
                                    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
                                    notes: z.ZodOptional<z.ZodString>;
                                    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
                                    soilType: z.ZodOptional<z.ZodString>;
                                    harvestDate: z.ZodOptional<z.ZodString>;
                                    createdAt: z.ZodString;
                                    updatedAt: z.ZodString;
                                }, "strip", z.ZodTypeAny, {
                                    id: string;
                                    name: string;
                                    species: string;
                                    createdAt: string;
                                    updatedAt: string;
                                    location?: string | undefined;
                                    plantedDate?: string | undefined;
                                    lastWatered?: string | undefined;
                                    wateringFrequency?: number | undefined;
                                    lastFertilized?: string | undefined;
                                    fertilizingFrequency?: number | undefined;
                                    notes?: string | undefined;
                                    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                    soilType?: string | undefined;
                                    harvestDate?: string | undefined;
                                }, {
                                    id: string;
                                    name: string;
                                    species: string;
                                    createdAt: string;
                                    updatedAt: string;
                                    location?: string | undefined;
                                    plantedDate?: string | undefined;
                                    lastWatered?: string | undefined;
                                    wateringFrequency?: number | undefined;
                                    lastFertilized?: string | undefined;
                                    fertilizingFrequency?: number | undefined;
                                    notes?: string | undefined;
                                    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                    soilType?: string | undefined;
                                    harvestDate?: string | undefined;
                                }>;
                            };
                        };
                    };
                    404: {
                        description: string;
                    };
                };
            };
            put: {
                summary: string;
                description: string;
                operationId: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: z.ZodObject<{
                                name: z.ZodOptional<z.ZodString>;
                                species: z.ZodOptional<z.ZodString>;
                                location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                                plantedDate: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
                                lastWatered: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
                                wateringFrequency: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
                                lastFertilized: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
                                fertilizingFrequency: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
                                notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                                sunlightRequirement: z.ZodOptional<z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>>;
                                soilType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
                                harvestDate: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodString>>>;
                            }, "strip", z.ZodTypeAny, {
                                name?: string | undefined;
                                species?: string | undefined;
                                location?: string | undefined;
                                plantedDate?: string | undefined;
                                lastWatered?: string | undefined;
                                wateringFrequency?: number | undefined;
                                lastFertilized?: string | undefined;
                                fertilizingFrequency?: number | undefined;
                                notes?: string | undefined;
                                sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                soilType?: string | undefined;
                                harvestDate?: string | undefined;
                            }, {
                                name?: string | undefined;
                                species?: string | undefined;
                                location?: string | undefined;
                                plantedDate?: string | undefined;
                                lastWatered?: string | undefined;
                                wateringFrequency?: number | undefined;
                                lastFertilized?: string | undefined;
                                fertilizingFrequency?: number | undefined;
                                notes?: string | undefined;
                                sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                soilType?: string | undefined;
                                harvestDate?: string | undefined;
                            }>;
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: z.ZodObject<{
                                    id: z.ZodString;
                                    name: z.ZodString;
                                    species: z.ZodString;
                                    location: z.ZodOptional<z.ZodString>;
                                    plantedDate: z.ZodOptional<z.ZodString>;
                                    lastWatered: z.ZodOptional<z.ZodString>;
                                    wateringFrequency: z.ZodOptional<z.ZodNumber>;
                                    lastFertilized: z.ZodOptional<z.ZodString>;
                                    fertilizingFrequency: z.ZodOptional<z.ZodNumber>;
                                    notes: z.ZodOptional<z.ZodString>;
                                    sunlightRequirement: z.ZodOptional<z.ZodEnum<["full-sun", "partial-shade", "shade"]>>;
                                    soilType: z.ZodOptional<z.ZodString>;
                                    harvestDate: z.ZodOptional<z.ZodString>;
                                    createdAt: z.ZodString;
                                    updatedAt: z.ZodString;
                                }, "strip", z.ZodTypeAny, {
                                    id: string;
                                    name: string;
                                    species: string;
                                    createdAt: string;
                                    updatedAt: string;
                                    location?: string | undefined;
                                    plantedDate?: string | undefined;
                                    lastWatered?: string | undefined;
                                    wateringFrequency?: number | undefined;
                                    lastFertilized?: string | undefined;
                                    fertilizingFrequency?: number | undefined;
                                    notes?: string | undefined;
                                    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                    soilType?: string | undefined;
                                    harvestDate?: string | undefined;
                                }, {
                                    id: string;
                                    name: string;
                                    species: string;
                                    createdAt: string;
                                    updatedAt: string;
                                    location?: string | undefined;
                                    plantedDate?: string | undefined;
                                    lastWatered?: string | undefined;
                                    wateringFrequency?: number | undefined;
                                    lastFertilized?: string | undefined;
                                    fertilizingFrequency?: number | undefined;
                                    notes?: string | undefined;
                                    sunlightRequirement?: "full-sun" | "partial-shade" | "shade" | undefined;
                                    soilType?: string | undefined;
                                    harvestDate?: string | undefined;
                                }>;
                            };
                        };
                    };
                    404: {
                        description: string;
                    };
                };
            };
            delete: {
                summary: string;
                description: string;
                operationId: string;
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    404: {
                        description: string;
                    };
                };
            };
        };
    };
};
export { PlantSchema, CreatePlantInputSchema, UpdatePlantInputSchema };
//# sourceMappingURL=openapi.d.ts.map