"use client";

import { useEffect, useState } from "react";
import {
    ComposedChart,
    Line,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ControlData {
    date: string;
    value: number;
    isOutlier: boolean;
}

interface ControlChartProps {
    data: ControlData[];
    mean: number;
    ucl: number;
    lcl: number;
}

export function ControlChart({ data, mean, ucl, lcl }: ControlChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <Card className="h-[500px] animate-pulse bg-slate-100" />;

    return (
        <Card className="h-[500px]">
            <CardHeader>
                <CardTitle>X-Bar Control Chart (Daily Avg Wait Time) - DEBUG v3</CardTitle>
            </CardHeader>
            <CardContent className="h-[420px]">
                <div className="mb-2 text-xs font-mono text-blue-600 bg-blue-50 p-2 rounded">
                    DEBUG PROPS: Points={data?.length} | First={data?.[0] ? JSON.stringify(data[0]) : "None"}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />

                        {/* Control Limits */}
                        <ReferenceLine y={mean} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Mean', position: 'right', fill: '#10b981', fontSize: 12 }} />
                        <ReferenceLine y={ucl} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'UCL (3σ)', position: 'right', fill: '#ef4444', fontSize: 12 }} />
                        <ReferenceLine y={lcl} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'LCL (3σ)', position: 'right', fill: '#ef4444', fontSize: 12 }} />

                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#000000"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#64748b" }}
                            activeDot={{ r: 6 }}
                            isAnimationActive={false}
                        />

                        {/* Highlight Outliers */}
                        <Scatter
                            data={data.filter(d => d.isOutlier)}
                            fill="#ef4444"
                            shape="circle"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
