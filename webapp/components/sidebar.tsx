"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Ruler,
    Search,
    TrendingUp,
    Activity,
    Database
} from "lucide-react";

const navItems = [
    { name: "Define (Baseline)", href: "/", icon: LayoutDashboard },
    { name: "Measure (Audit)", href: "/measure", icon: Ruler },
    { name: "Analyze (Root Cause)", href: "/analyze", icon: Search },
    { name: "Improve (What-If)", href: "/improve", icon: TrendingUp },
    { name: "Control (SPC)", href: "/control", icon: Activity },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-800">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Database className="h-6 w-6" />
                    <span className="">Mental Health Ops</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-slate-900 dark:hover:text-slate-50",
                                    isActive
                                        ? "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto border-t p-4 text-xs text-slate-500">
                <p>Dan Data Verification</p>
                <p>Power BI Fidelity Mode</p>
            </div>
        </div>
    );
}
