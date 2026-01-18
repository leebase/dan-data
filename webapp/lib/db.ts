import Database from 'better-sqlite3';
import path from 'path';

// Database is mounted at /workspace/mental_health_demo.sqlite in the container
// or locally at ../workspace/mental_health_demo.sqlite
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), '../workspace/mental_health_demo.sqlite');

let db: ReturnType<typeof Database> | undefined;

export function getDb() {
    if (!db) {
        console.log(`Connection to database at ${DB_PATH}`);
        db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
        // Optimize for reading - removed WAL to prevent write attempts on RO mount
        // db.pragma('journal_mode = WAL');
    }
    return db;
}
