"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Timer, Users, DollarSign } from "lucide-react";

interface ScenarioProps {
    baselineNoShows: number;
    baselineMinutesLost: number;
    avgRevenuePerEncounter?: number; // Optional
}

export function WhatIfScenario({ baselineNoShows, baselineMinutesLost }: ScenarioProps) {
    const [eductionPct, setReductionPct] = useState(10); // Default 10% reduction

    const recoveredEncounters = Math.round(baselineNoShows * (eductionPct / 100));
    const recoveredHours = Math.round((baselineMinutesLost * (eductionPct / 100)) / 60);

    // Assume avg revenue per encounter is ~$150 for this demo
    const estRevenue = recoveredEncounters * 150;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Scenario Parameter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <label className="font-medium">Target Reduction in No-Show Rate</label>
                            <span className="font-bold text-blue-600">{eductionPct}%</span>
                        </div>
                        <Slider
                            defaultValue={[10]}
                            max={50}
                            step={1}
                            onValueChange={(vals) => setReductionPct(vals[0])}
                            className="w-full"
                        />
                        <p className="text-xs text-slate-500">
                            Simulating impact if we implemented SMS reminders + waitlist logic.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">Recovered Encounters</CardTitle>
                        <Users className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">+{recoveredEncounters.toLocaleString()}</div>
                        <p className="text-xs text-emerald-600/80">Patients seen</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-400">Recovered Capacity</CardTitle>
                        <Timer className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">+{recoveredHours.toLocaleString()} hrs</div>
                        <p className="text-xs text-blue-600/80">Clinical time saved</p>
                    </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">Est. Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">+${estRevenue.toLocaleString()}</div>
                        <p className="text-xs text-amber-600/80">@ $150/visit</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
