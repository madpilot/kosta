# AGENTS.md

## Overview

This repository contains the Garden Agent project - an AI-powered gardening assistant that manages plants and schedules maintenance tasks through an API.

### Project Structure

```
src/
├── index.ts              # Express server with REST endpoints
├── openapi.ts            # API specification & Zod validation schemas
├── models/               # TypeScript type definitions & models
├── services/             # Business logic layer
├── db/                   # Database layer (SQLite wrapper)
└── [service].test.ts     # Unit tests for each service
```

### Technology Stack

- **Runtime**: TypeScript
- **Server**: Express.js
- **Database**: Better-sqlite3 (WAL mode)
- **Validation**: Zod
- **Testing**: Jest
- **API Spec**: OpenAPI 3.0.3

### Key Components

1. **Service Layer** (`src/services/*`): Business logic separating concerns
2. **Database Layer** (`src/db/`): SQLite operations and connection management
3. **Models** (`src/models/*`): TypeScript interfaces and Zod schemas
4. **Server** (`src/index.ts`): REST API endpoints

### Database Schema

**plants table**

- `id`: UUID primary key
- `name`: Plant name
- `species`: Plant species
- `location`: Plant location
- `plantedDate`, `lastWatered`, `lastFertilized`: Date tracking
- `wateringFrequency`, `fertilizingFrequency`: Frequency settings
- `sunlightRequirement`, `soilType`, `harvestDate`: Plant characteristics

**calendar_events table**

- `id`: UUID primary key
- `plant_id`: Foreign key to plants table
- `type`: water | fertilize | harvest | other
- `date`: ISO datetime
- `notes`: Event description
- `completed`: Boolean completion status

## Agent Guidelines

### Service Agents 🤖

**Purpose**: Understand and interact with the business logic

**Tasks**:

- Read and interpret service implementations in `src/services/`
- Understand the database interface in `src/db/`
- Compose API requests using OpenAPI schemas from `src/openapi.ts`

**Key Files**:

- `src/services/plants.ts` - Plant management business logic
- `src/services/calendar.ts` - Calendar event management business logic
- `src/db/sqlite.ts` - Database wrapper and operations

**API Endpoints**:

- `GET /api/plants` - List all plants
- `POST /api/plants` - Create a plant
- `GET/PUT/DELETE /api/plants/:id` - Plant CRUD operations
- `GET /api/calendar/` - List all events
- `GET/POST /api/calendar/` - Event CRUD operations
- `GET /api/calendar/[today|week|month|upcoming|...]` - Time-based queries

### Review Agents 🔍

**Purpose**: Code quality and structure reviews

**Tasks**:

- Analyze TypeScript type safety
- Review database connection patterns
- Check API endpoint design
- Verify error handling coverage

**Focus Areas**:

- `src/db/sqlite.ts:63-188` - Database wrapper implementation
- `src/index.ts:1-220` - Express server setup and routes
- `src/services/*.ts` - Service layer encapsulation

**Linting Standards**:

```bash
npm run lint        # ESLint for TypeScript
npm run typecheck   # TypeScript compiler checks
npm test            # Jest unit tests
```

### Testing Agents 🧪

**Purpose**: Create and maintain test coverage

**Tasks**:

- Write unit tests for service functions
- Test API endpoints with integration tests
- Verify database operations with test fixtures

**Test Structure**:

```typescript
// Test files follow: [service].test.ts pattern
// Example from src/services/plants.test.ts
describe('PlantService', () => {
  // Mock database
  // Test each method
  // Verify edge cases
});
```

**Running Tests**:

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

### Documentation Agents 📚

**Purpose**: Maintain and update project documentation

**Tasks**:

- Update AGENTS.md as architecture changes
- Create API usage examples
- Document new endpoints
- Update Zod schemas with examples

**Documentation Standards**:

- Keep code and documentation in sync
- Use TypeScript types as reference documentation
- Include OpenAPI spec URL for API introspection
- Document all environment variables

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run type checker
npm run typecheck

# Run linter
npm run lint

# Run tests
npm test
```

### Database Setup

- Default location: `./data/garden.db`
- Environment variable: `DATABASE_URL`
- Auto-creates tables on init
- Uses WAL mode for concurrency

### Configuration

**Environment Variables**:

```
PORT=3000          # Server port
HOST=0.0.0.0       # Server host
DATABASE_URL=      # Custom database path
```

## Code Quality Standards

### TypeScript Usage

- Strict mode enabled
- Use TypeScript types instead of any
- Leverage Zod for runtime validation
- Export type definitions from `src/models/`

### Error Handling

- Services return `null` for not-found cases
- API endpoints return 404 for missing resources
- API endpoints return 500 for unexpected errors
- Input validation through Zod schemas

### Database Operations

- Use prepared statements to prevent SQL injection
- Wrap database calls in try-catch blocks
- Close database connections on shutdown
- Transaction handling for write operations

### API Design

- RESTful endpoint naming (`/api/[resource]`)
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Status codes consistent with RFC 9110
- OpenAPI 3.0.3 specification for introspection

## Integration Guidelines

### Adding New Endpoints

1. Update API routes in `src/index.ts`
2. Add corresponding Zod schema to `src/openapi.ts`
3. Expand service logic in `src/services/`
4. Update OpenAPI spec paths if needed
5. Write tests in `[service].test.ts`

### Adding New Models

1. Define Zod schema in `src/openapi.ts`
2. Create TypeScript type from schema
3. Update database schema if needed
4. Implement service methods
5. Write tests

### Adding New Features

1. Identify affected services
2. Update database schema through migration
3. Implement business logic in service layer
4. Expose via REST API endpoints
5. Add OpenAPI documentation
6. Write tests for new functionality

## API Usage Examples

### Create a Plant

```bash
curl -X POST http://localhost:3000/api/plants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monstera",
    "species": "Monstera deliciosa",
    "location": "Living room",
    "wateringFrequency": 7
  }'
```

### Get Today's Schedule

```bash
curl http://localhost:3000/api/calendar/today
```

### Mark Event as Complete

```bash
curl -X PATCH http://localhost:3000/api/calendar/:id/complete
```

### Access API Schema

```bash
GET http://localhost:3000/api/openapi.json
```

## Common Patterns

### Database Wrapper Pattern

```typescript
const service = createPlantService(db);
// Returns object with methods
// Delegates to DatabaseWrapper interface
```

### Service Layer Pattern

```typescript
export const createCalendarService = (db: CalendarDatabase): CalendarService => {
  const service: CalendarService = {
    // Method implementations
  };
  return service;
};
```

### Zod Validation Pattern

```typescript
const schema = PlantSchema;
const validInput = schema.parse(req.body);
// Throws error if invalid
```

## Agent Collaboration

### Service + Review Workflow

1. Service agent implements new feature
2. Review agent validates code quality
3. Service agent iterates on feedback
4. Review agent confirms acceptance

### Testing + Documentation Workflow

1. Test agent writes tests
2. Documentation agent updates API examples
3. Test agent verifies documentation accuracy

## Dependencies Management

- **@orpc/server**: Server framework integration
- **better-sqlite3**: SQLite database with prepared statements
- **express**: HTTP server and routing
- **jose**: JWT-based authentication (for future use)
- **zod**: Runtime type validation
- **uuid**: Unique identifier generation
- **@types/\***: TypeScript definitions

## Security Considerations

- Database operations use prepared statements
- SQL injection protection in `src/db/sqlite.ts`
- External API calls use input validation
- Authentication layer ready for JWT implementation
- CORS headers managed by Express

## Performance Considerations

- SQLite WAL mode for concurrent reads
- Indexes on frequently queried columns (date, plant_id)
- Prepared statements reuse compiled queries
- Type-safe validation prevents malformed data
- Minimizes database round trips in logic layer

## Troubleshooting

### Common Issues

**Database locked error**: Check WAL mode is enabled
**Type errors**: Run `npm run typecheck`
**Test failures**: Check database cleanup in test setup
**Server won't start**: Verify PORT and HOST environment variables

### Debug Mode

```bash
# Enable verbose logging
DEBUG=*

# Check database connection
# Verify SQLite file exists in ./data/
```

## Future Enhancements

- [ ] JWT authentication middleware
- [ ] Rate limiting for public endpoints
- [ ] WebSocket support for real-time updates
- [ ] Redis cache for frequently accessed data
- [ ] PostgreSQL migration path
- [ ] GraphQL API endpoint
- [ ] Plant health monitoring integration
- [ ] Weather-based watering recommendations
