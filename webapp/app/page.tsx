import { getDb } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/charts/TrendChart";
import { Activity, Calendar, Users } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function Home() {
  const db = getDb();

  // Fetch KPI Baseline
  const kpi = db.prepare("SELECT * FROM vw_kpi_baseline").get() as {
    total_encounters: number;
    avg_wait_days: number;
    no_show_rate: number;
  };

  // Fetch Trend Data
  // Group by Year-Month to show timeline
  const trendData = db.prepare(`
    SELECT 
      strftime('%Y-%m', d.full_date) as month_key,
      d.month_name || ' ' || d.year as month_label,
      COUNT(*) as encounters,
      ROUND(AVG(f.wait_days), 1) as waitDays
    FROM fact_encounter f
    JOIN dim_date d ON f.request_date_key = d.date_key
    GROUP BY d.year, d.month_num
    ORDER BY d.year, d.month_num
  `).all() as { month_key: string; month_label: string; encounters: number; waitDays: number }[];

  const chartData = trendData.map(d => ({
    month: d.month_label,
    encounters: d.encounters,
    waitDays: d.waitDays
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Phase 1: DEFINE (Baseline)</h1>
        <div className="text-sm text-slate-500">
          Source: vw_kpi_baseline
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Encounters</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.total_encounters.toLocaleString()}</div>
            <p className="text-xs text-slate-500">
              Total volume across all time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Days</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.avg_wait_days}</div>
            <p className="text-xs text-slate-500">
              Request to Scheduled delta
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.no_show_rate}%</div>
            <p className="text-xs text-slate-500">
              Missed appointments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <TrendChart data={chartData} />
    </div>
  );
}
