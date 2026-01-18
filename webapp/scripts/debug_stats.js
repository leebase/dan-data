const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = '/workspace/mental_health_demo.sqlite';

const db = new Database(DB_PATH, { readonly: true });

// Check stats
const r = db.prepare(`
    WITH DailyAvg AS (
        SELECT request_date_key, AVG(wait_days) as daily_mean 
        FROM fact_encounter 
        GROUP BY request_date_key
    ) 
    SELECT 
        AVG(daily_mean) as process_mean, 
        SQRT(AVG(daily_mean*daily_mean) - AVG(daily_mean)*AVG(daily_mean)) as process_sd 
    FROM DailyAvg
`).get();

console.log('Mean:', r.process_mean.toFixed(2));
console.log('SD:', r.process_sd.toFixed(2));
console.log('UCL:', (r.process_mean + 3 * r.process_sd).toFixed(2));
console.log('LCL:', Math.max(0, r.process_mean - 3 * r.process_sd).toFixed(2));
