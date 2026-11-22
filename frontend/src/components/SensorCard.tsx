import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { MetricKey, MetricState, SensorMask } from '../types/atmodesq';

interface SensorCardProps {
    metricKey: MetricKey;
    label: string;
    value: number | null;
    unit: string;
    state: MetricState;
    mask?: SensorMask;
    trend15m?: number | null;
    sparkline1h?: number[];
    thresholds?: { warn?: number; crit?: number } | null;
}

const STATE_STYLES: Record<MetricState, string> = {
    OK: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    WARN: 'bg-amber-50 text-amber-700 ring-amber-200',
    CRIT: 'bg-rose-50 text-rose-700 ring-rose-200',
    IGNORED: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const LINE_COLORS: Record<MetricState, string> = {
    OK: '#10b981',
    WARN: '#f59e0b',
    CRIT: '#ef4444',
    IGNORED: '#94a3b8',
};

export function SensorCard({
                               label,
                               value,
                               unit,
                               state,
                               mask = 'ACTIVE',
                               trend15m = null,
                               sparkline1h = [],
                               thresholds = null,
                           }: SensorCardProps) {
    const isMuted = mask === 'DISABLED' || state === 'IGNORED';
    const showThresholdBar =
        !isMuted &&
        thresholds !== null &&
        typeof thresholds.warn === 'number' &&
        typeof thresholds.crit === 'number' &&
        value !== null;

    const sparklineData = sparkline1h.map((v, i) => ({ idx: i, val: v }));

    let barPercent = 0;
    let warnPercent = 60;
    if (showThresholdBar && thresholds?.warn && thresholds?.crit && value !== null) {
        const maxScale = Math.max(thresholds.crit * 1.25, value);
        barPercent = Math.min(100, Math.max(0, (value / maxScale) * 100));
        warnPercent = Math.min(95, (thresholds.warn / maxScale) * 100);
    }

    return (
        <div
            className={`flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-sm transition ${
                isMuted
                    ? 'border-slate-200/80 opacity-65'
                    : state === 'CRIT'
                        ? 'border-rose-200'
                        : state === 'WARN'
                            ? 'border-amber-200'
                            : 'border-slate-200'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>

                <div className="flex items-center gap-1">
                    {mask === 'MONITOR_ONLY' && (
                        <span
                            title="Monitor Only (neovlivňuje skóre)"
                            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600"
                        >
              [M]
            </span>
                    )}
                    <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${STATE_STYLES[state]}`}
                    >
            {state}
          </span>
                </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900">
            {value === null ? '—' : Number(value.toFixed(1))}
          </span>
                    <span className="text-xs font-medium text-slate-500">{unit}</span>
                </div>

                {trend15m !== null && (
                    <span
                        title="Změna za posledních 15 minut"
                        className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-500"
                    >
            {trend15m > 0.1 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
            ) : trend15m < -0.1 ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
                <Minus className="h-3.5 w-3.5 text-slate-400" />
            )}
                        {trend15m > 0 ? `+${trend15m.toFixed(1)}` : trend15m.toFixed(1)}
          </span>
                )}
            </div>

            {showThresholdBar && thresholds && (
                <div className="mt-3">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${barPercent}%`,
                                backgroundColor: LINE_COLORS[state],
                            }}
                        />
                        <div
                            className="absolute top-0 h-full w-0.5 bg-slate-400"
                            style={{ left: `${warnPercent}%` }}
                            title={`WARN: ${thresholds.warn} ${unit}`}
                        />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>WARN {thresholds.warn}</span>
                        <span>CRIT {thresholds.crit}</span>
                    </div>
                </div>
            )}

            {sparklineData.length >= 2 && (
                <div className="mt-3 h-10 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                            <Line
                                type="monotone"
                                dataKey="val"
                                stroke={LINE_COLORS[state]}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}