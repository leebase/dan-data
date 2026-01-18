import { getDb } from "@/lib/db";
import { WhatIfScenario } from "@/components/WhatIfScenario";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function ImprovePage() {
    const db = getDb();

    // Baseline Baseline Stats
    const baseline = db.prepare(`
    SELECT 
        COUNT(*) as total_noshows, 
        SUM(duration_minutes) as total_minutes_lost 
    FROM fact_encounter 
    WHERE encounter_status='NoShow'
  `).get() as { total_noshows: number; total_minutes_lost: number };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Phase 4: IMPROVE (Model Interventions)</h1>
                <div className="text-sm text-slate-500">
                    Baseline: {baseline.total_noshows.toLocaleString()} No-Shows, {Math.round(baseline.total_minutes_lost / 60).toLocaleString()} Hours Lost
                </div>
            </div>

            <WhatIfScenario
                baselineNoShows={baseline.total_noshows}
                baselineMinutesLost={baseline.total_minutes_lost}
            />
        </div>
    );
}
