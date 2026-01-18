import { getDb } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default function MeasurePage() {
    const db = getDb();

    // Fetch Audit View
    const audit = db.prepare("SELECT * FROM vw_wait_time_audit").get() as {
        total_rows: number;
        mismatch_count: number;
        avg_variance: number;
    };

    const isPass = audit.mismatch_count === 0;

    // Fetch failing rows if any
    const failures = isPass ? [] : db.prepare(`
    SELECT 
        encounter_id,
        request_date_key,
        scheduled_date_key,
        wait_days,
        (JULIANDAY(SUBSTR(scheduled_date_key, 1, 4) || '-' || SUBSTR(scheduled_date_key, 5, 2) || '-' || SUBSTR(scheduled_date_key, 7, 2)) - JULIANDAY(SUBSTR(request_date_key, 1, 4) || '-' || SUBSTR(request_date_key, 5, 2) || '-' || SUBSTR(request_date_key, 7, 2))) as calc_wait
    FROM fact_encounter
    WHERE wait_days != (JULIANDAY(SUBSTR(scheduled_date_key, 1, 4) || '-' || SUBSTR(scheduled_date_key, 5, 2) || '-' || SUBSTR(scheduled_date_key, 7, 2)) - JULIANDAY(SUBSTR(request_date_key, 1, 4) || '-' || SUBSTR(request_date_key, 5, 2) || '-' || SUBSTR(request_date_key, 7, 2)))
    LIMIT 50
  `).all();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Phase 2: MEASURE (Audit)</h1>
                <div className="text-sm text-slate-500">
                    Source: vw_wait_time_audit
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Card */}
                <Card className={cn("border-l-4", isPass ? "border-l-emerald-500" : "border-l-red-500")}>
                    <CardHeader>
                        <CardTitle>Validation Status</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4">
                        {isPass ? (
                            <CheckCircle className="h-12 w-12 text-emerald-500" />
                        ) : (
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        )}
                        <div>
                            <div className="text-2xl font-bold">{isPass ? "PASS" : "FAIL"}</div>
                            <p className="text-slate-500">
                                {isPass
                                    ? "All 80,000 rows match the calculation formula."
                                    : `${audit.mismatch_count} rows have incorrect wait_days.`}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Details Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Audit Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Total Rows Checked</span>
                            <span className="font-mono font-bold">{audit.total_rows.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Mismatch Count</span>
                            <span className={cn("font-mono font-bold", isPass ? "text-emerald-600" : "text-red-600")}>
                                {audit.mismatch_count}
                            </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500">Avg Variance</span>
                            <span className="font-mono font-bold">{audit.avg_variance || 0} days</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {!isPass && (
                <Card>
                    <CardHeader>
                        <CardTitle>Mismatch Samples (First 50)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="py-2">Encounter ID</th>
                                    <th className="py-2">Request</th>
                                    <th className="py-2">Scheduled</th>
                                    <th className="py-2 text-right">Stored Wait</th>
                                    <th className="py-2 text-right">Calc Wait</th>
                                </tr>
                            </thead>
                            <tbody>
                                {failures.map((row: any) => (
                                    <tr key={row.encounter_id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="py-2">{row.encounter_id}</td>
                                        <td className="py-2">{row.request_date_key}</td>
                                        <td className="py-2">{row.scheduled_date_key}</td>
                                        <td className="py-2 text-right text-red-600 font-bold">{row.wait_days}</td>
                                        <td className="py-2 text-right text-emerald-600 font-bold">{row.calc_wait}</td>
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
