"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
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

// Custom dot component that colors outliers red
const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;

    const isOutlier = payload?.isOutlier;
    const fill = isOutlier ? "#ef4444" : "#64748b";
    const radius = isOutlier ? 6 : 3;

    return (
        <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill={fill}
            stroke={isOutlier ? "#dc2626" : "none"}
            strokeWidth={isOutlier ? 2 : 0}
        />
    );
};

export function ControlChart({ data, mean, ucl, lcl }: ControlChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <Card className="h-[500px] animate-pulse bg-slate-100" />;

    return (
        <Card className="h-[500px]">
            <CardHeader>
                <CardTitle>X-Bar Control Chart (Daily Avg Wait Time)</CardTitle>
            </CardHeader>
            <CardContent className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`${value.toFixed(2)} days`, 'Avg Wait']}
                        />

                        {/* Control Limits */}
                        <ReferenceLine y={mean} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Mean', position: 'right', fill: '#10b981', fontSize: 12 }} />
                        <ReferenceLine y={ucl} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'UCL (3σ)', position: 'right', fill: '#ef4444', fontSize: 12 }} />
                        <ReferenceLine y={lcl} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'LCL (3σ)', position: 'right', fill: '#ef4444', fontSize: 12 }} />

                        {/* Line with custom dots - outliers are red and larger */}
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#000000"
                            strokeWidth={2}
                            dot={<CustomDot />}
                            activeDot={{ r: 8 }}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
