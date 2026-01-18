import { getDb } from "@/lib/db";
import { ControlChart } from "@/components/charts/ControlChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default function ControlPage() {
    const db = getDb();

    // 1. Calculate Global Process Stats (Mean & SD of daily averages)
    // We first aggregate daily, then get stats of those daily aggregations
    const dailyStats = db.prepare(`
    WITH DailyAvg AS (
        SELECT 
            request_date_key,
            AVG(wait_days) as daily_mean
        FROM fact_encounter
        GROUP BY request_date_key
    )
    SELECT 
        AVG(daily_mean) as process_mean,
        -- SQLite doesn't have STDDEV, approximate it or use manual calc
        -- STDDEV = SQRT(AVG(x*x) - AVG(x)*AVG(x))
        SQRT(AVG(daily_mean*daily_mean) - AVG(daily_mean)*AVG(daily_mean)) as process_sd
    FROM DailyAvg
  `).get() as { process_mean: number; process_sd: number };

    const mean = dailyStats.process_mean || 0;
    const sigma = dailyStats.process_sd || 0;
    const ucl = mean + (3 * sigma);
    const lcl = Math.max(0, mean - (3 * sigma));

    // 2. Fetch Daily Data (Last 90 days for readability)
    // We need to join with dim_date to get readable dates and proper ordering
    const data = db.prepare(`
    SELECT 
        d.full_date as date,
        AVG(f.wait_days) as value
    FROM fact_encounter f
    JOIN dim_date d ON f.request_date_key = d.date_key
    GROUP BY d.full_date
    ORDER BY d.full_date DESC
    LIMIT 90
  `).all() as { date: string; value: number }[];

    // Re-sort ascending for chart
    const chartData = data.reverse().map(d => ({
        ...d,
        value: parseFloat(d.value.toFixed(2)),
        isOutlier: d.value > ucl || d.value < lcl
    }));

    const outliers = chartData.filter(d => d.isOutlier);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Phase 5: CONTROL (SPC)</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Process Mean</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mean.toFixed(1)} days</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Process Sigma</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sigma.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className={outliers.length > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Recent Outliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{outliers.length}</div>
                        <p className="text-xs text-slate-500">In last 90 days</p>
                    </CardContent>
                </Card>
            </div>

            <ControlChart
                data={chartData}
                mean={parseFloat(mean.toFixed(2))}
                ucl={parseFloat(ucl.toFixed(2))}
                lcl={parseFloat(lcl.toFixed(2))}
            />

            {/* Outlier List */}
            {outliers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Outlier Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="py-2">Date</th>
                                    <th className="py-2">Value</th>
                                    <th className="py-2">Distance from Mean</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outliers.map(row => (
                                    <tr key={row.date} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="py-2">{row.date}</td>
                                        <td className="py-2 font-bold text-red-600">{row.value}</td>
                                        <td className="py-2">
                                            {((row.value - mean) / sigma).toFixed(1)}σ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
