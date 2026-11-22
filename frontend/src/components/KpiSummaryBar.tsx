import { Brain, CheckCircle2, Wind } from 'lucide-react';
import type { TimeRange } from '../types/atmodesq';

interface KpiSummaryBarProps {
    averageFocusScore: number | null;
    optimalCo2Percentage: number | null;
    ventilationCount: number;
    range: TimeRange;
    loading?: boolean;
}

const RANGE_LABELS: Record<TimeRange, string> = {
    '24h': 'za posledních 24 hodin',
    '7d': 'za posledních 7 dní',
    '30d': 'za posledních 30 dní',
};

export function KpiSummaryBar({
                                  averageFocusScore,
                                  optimalCo2Percentage,
                                  ventilationCount,
                                  range,
                                  loading = false,
                              }: KpiSummaryBarProps) {
    const cards = [
        {
            label: 'Průměrné Focus Score',
            value:
                averageFocusScore === null ? null : `${Math.round(averageFocusScore)} %`,
            icon: Brain,
            accent: 'bg-emerald-50 text-emerald-600',
        },
        {
            label: 'Čas v optimálním CO₂',
            value:
                optimalCo2Percentage === null
                    ? null
                    : `${Math.round(optimalCo2Percentage)} %`,
            icon: CheckCircle2,
            accent: 'bg-sky-50 text-sky-600',
        },
        {
            label: 'Počet vyvětrání',
            value: `${ventilationCount}×`,
            icon: Wind,
            accent: 'bg-indigo-50 text-indigo-600',
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {cards.map(({ label, value, icon: Icon, accent }) => (
                <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </span>
                        <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}
                        >
              <Icon className="h-4 w-4" />
            </span>
                    </div>

                    {loading ? (
                        <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
                    ) : (
                        <div className="mt-3">
                            <div className="text-2xl font-bold text-slate-900">
                                {value === null ? '—' : value}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {value === null ? 'Bez dat' : RANGE_LABELS[range]}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}