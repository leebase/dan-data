"use client";

import {
    Scatter,
    ScatterChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    ZAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScatterData {
    name: string;
    x: number; // Load
    y: number; // Outcome
}

export function ProviderScatterChart({ data }: { data: ScatterData[] }) {
    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Provider Performance: Load vs Outcome</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" dataKey="x" name="Encounters" unit="" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Patient Load', position: 'bottom', offset: 0 }} />
                        <YAxis type="number" dataKey="y" name="Avg Score" unit="" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} label={{ value: 'Outcome Score', angle: -90, position: 'left' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Providers" data={data} fill="#8884d8" shape="circle" />
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
