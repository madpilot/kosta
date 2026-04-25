import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './index';
export declare const initSqlite: (dbFile?: string) => Database.Database;
export declare const createPlantTable: (database: Database.Database) => void;
export declare const createSqliteDatabase: (dbFile?: string) => DatabaseWrapper;
export declare const getDatabase: () => DatabaseWrapper;
//# sourceMappingURL=sqlite.d.ts.map