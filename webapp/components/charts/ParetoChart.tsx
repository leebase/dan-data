"use client";

import {
    Bar,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ParetoData {
    name: string;
    count: number;
    cumulativePercentage: number;
}

interface ParetoChartProps {
    title: string;
    data: ParetoData[];
}

export function ParetoChart({ title, data }: ParetoChartProps) {
    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" unit="%" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar yAxisId="left" dataKey="count" fill="#0ea5e9" barSize={30} radius={[4, 4, 0, 0]} name="No-Shows" />
                        <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#f43f5e" strokeWidth={2} dot={false} name="Cumulative %" />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
