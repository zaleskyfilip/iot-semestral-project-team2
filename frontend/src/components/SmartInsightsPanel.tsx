import { CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface SmartInsightsPanelProps {
    insights: string[];
    lastUpdate: string | null;
    loading?: boolean;
}

export function SmartInsightsPanel({
                                       insights,
                                       lastUpdate,
                                       loading = false,
                                   }: SmartInsightsPanelProps) {
    const visibleInsights = insights.slice(0, 10);

    return (
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        Smart Insights
                    </h3>
                    {lastUpdate && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
                            {new Date(lastUpdate).toLocaleTimeString('cs-CZ')}
            </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-2">
                        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
                        <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
                    </div>
                ) : visibleInsights.length === 0 ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-sm text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <span>Všechny parametry jsou v optimálním rozmezí.</span>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {visibleInsights.map((text, idx) => (
                            <li
                                key={`${idx}-${text}`}
                                className="rounded-xl border border-amber-100 bg-amber-50/70 px-3.5 py-2.5 text-sm text-slate-800"
                            >
                                {text}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}