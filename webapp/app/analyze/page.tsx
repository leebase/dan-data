import { getDb } from "@/lib/db";
import { ParetoChart } from "@/components/charts/ParetoChart";
import { ProviderScatterChart } from "@/components/charts/ScatterChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function AnalyzePage() {
    const db = getDb();

    // 1. Pareto: No-Shows by Facility
    const facilityData = db.prepare(`
    SELECT f.facility_name as name, SUM(fe.no_show_flag) as count
    FROM fact_encounter fe
    JOIN dim_facility f ON fe.facility_id = f.facility_id
    GROUP BY f.facility_name
    ORDER BY count DESC
  `).all() as { name: string; count: number }[];

    const totalFacilityNoShows = facilityData.reduce((acc, curr) => acc + curr.count, 0);
    let runningTotal = 0;
    const paretoFacility = facilityData.map(d => {
        runningTotal += d.count;
        return {
            ...d,
            cumulativePercentage: Math.round((runningTotal / totalFacilityNoShows) * 100)
        };
    });

    // 2. Heatmap Data: Facility x Day of Week
    const heatmapData = db.prepare(`
    SELECT 
        f.facility_name,
        d.day_name,
        d.day_of_week, -- for sorting
        ROUND(AVG(fe.no_show_flag) * 100, 1) as rate
    FROM fact_encounter fe
    JOIN dim_facility f ON fe.facility_id = f.facility_id
    JOIN dim_date d ON fe.scheduled_date_key = d.date_key
    GROUP BY f.facility_name, d.day_name, d.day_of_week
    ORDER BY f.facility_name, d.day_of_week
  `).all() as { facility_name: string; day_name: string; rate: number }[];

    // Transform for grid
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const facilities = Array.from(new Set(heatmapData.map(d => d.facility_name))).sort();

    const heatmapGrid = facilities.map(fac => {
        return {
            name: fac,
            days: days.map(day => {
                const entry = heatmapData.find(d => d.facility_name === fac && d.day_name === day);
                return entry ? entry.rate : 0;
            })
        };
    });


    // 3. Scatter: Load vs Outcome
    const scatterData = db.prepare(`
    SELECT 
        p.provider_name as name,
        COUNT(*) as x,
        ROUND(AVG(fe.outcome_score), 1) as y
    FROM fact_encounter fe
    JOIN dim_provider p ON fe.provider_id = p.provider_id
    WHERE fe.encounter_status = 'Completed'
    GROUP BY p.provider_name
  `).all() as { name: string; x: number; y: number }[];


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Phase 3: ANALYZE (Root Cause)</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Pareto */}
                <ParetoChart title="No-Shows by Facility (Pareto)" data={paretoFacility} />

                {/* Scatter */}
                <ProviderScatterChart data={scatterData} />
            </div>

            {/* Heatmap */}
            <Card>
                <CardHeader>
                    <CardTitle>No-Show Rate Heatmap (Facility x Day)</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto">
                    <div className="min-w-[600px]">
                        <div className="grid grid-cols-8 gap-1 mb-1 text-xs font-semibold text-center text-slate-500">
                            <div className="text-left pl-2">Facility</div>
                            {days.map(d => <div key={d}>{d.substring(0, 3)}</div>)}
                        </div>
                        {heatmapGrid.map(row => (
                            <div key={row.name} className="grid grid-cols-8 gap-1 mb-1 text-sm">
                                <div className="flex items-center pl-2 font-medium truncate" title={row.name}>{row.name}</div>
                                {row.days.map((rate, i) => {
                                    // Color scale logic
                                    const intensity = Math.min(rate / 30, 1); // Cap at 30%
                                    const color = `rgba(239, 68, 68, ${intensity})`; // Tailwind red-500
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center justify-center h-8 rounded text-xs font-medium"
                                            style={{ backgroundColor: color, color: intensity > 0.5 ? 'white' : 'black' }}
                                            title={`${rate}%`}
                                        >
                                            {rate}%
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
