interface ScoreGaugeProps {
    title: string;
    value: number | null;
    subtitle?: string;
    loading?: boolean;
}

function getScoreColor(value: number | null): {
    stroke: string;
    text: string;
    label: string;
} {
    if (value === null) {
        return { stroke: '#cbd5e1', text: 'text-slate-400', label: 'Bez dat' };
    }
    if (value >= 80) {
        return { stroke: '#10b981', text: 'text-emerald-600', label: 'Optimální' };
    }
    if (value >= 55) {
        return { stroke: '#f59e0b', text: 'text-amber-600', label: 'Zhoršené' };
    }
    return { stroke: '#ef4444', text: 'text-rose-600', label: 'Kritické' };
}

export function ScoreGauge({
                               title,
                               value,
                               subtitle,
                               loading = false,
                           }: ScoreGaugeProps) {
    const clamped = value === null ? 0 : Math.max(0, Math.min(100, value));
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clamped / 100) * circumference;
    const color = getScoreColor(value);

    return (
        <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>

            {loading ? (
                <div className="my-4 h-32 w-32 animate-pulse rounded-full bg-slate-100" />
            ) : (
                <div className="relative my-3 flex h-32 w-32 items-center justify-center">
                    <svg className="h-32 w-32 -rotate-90" viewBox="0 0 128 128">
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="10"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r={radius}
                            fill="none"
                            stroke={color.stroke}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${color.text}`}>
              {value === null ? '— %' : `${Math.round(value)} %`}
            </span>
                    </div>
                </div>
            )}

            <p className="text-xs font-medium text-slate-500">
                {subtitle || color.label}
            </p>
        </div>
    );
}