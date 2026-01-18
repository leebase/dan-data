const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = '/workspace/mental_health_demo.sqlite';

try {
    const db = new Database(DB_PATH, { readonly: true });

    // Check recent daily averages
    const rows = db.prepare(`
        SELECT 
            d.full_date,
            AVG(f.wait_days) as avg_wait
        FROM fact_encounter f
        JOIN dim_date d ON f.request_date_key = d.date_key
        GROUP BY d.full_date
        ORDER BY d.full_date DESC
        LIMIT 100
    `).all();

    console.log("--- Last 20 Daily Averages ---");
    rows.forEach(r => {
        console.log(`${r.full_date}: ${r.avg_wait.toFixed(2)}`);
    });

} catch (err) {
    console.error("Error opening DB:", err);
}
