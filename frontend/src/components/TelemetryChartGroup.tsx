import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { TelemetryPoint, TimeRange } from '../types/atmodesq';

interface TelemetryChartGroupProps {
    series: TelemetryPoint[];
    range: TimeRange;
    loading?: boolean;
}

function formatAxisTime(iso: string, range: TimeRange): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    if (range === '24h') {
        return date.toLocaleTimeString('cs-CZ', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }
    return date.toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
    });
}

function formatTooltipTime(iso: unknown): string {
    if (typeof iso !== 'string') return String(iso ?? '');
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('cs-CZ');
}

export function TelemetryChartGroup({
                                        series,
                                        range,
                                        loading = false,
                                    }: TelemetryChartGroupProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                    <div
                        key={n}
                        className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                    />
                ))}
            </div>
        );
    }

    if (series.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                <BarChart3 className="mb-3 h-10 w-10 text-slate-400" />
                <p className="text-base font-medium text-slate-700">
                    Za zvolené období nejsou dostupná žádná data.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Zkus zvolit delší časové období nebo odeslat testovací telemetrii.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 1. Kognitivní prostředí */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">
                        Kognitivní prostředí
                    </h3>
                    <p className="text-xs text-slate-500">
                        CO₂ (ppm), osvětlení (lx) a Focus Readiness Score (%)
                    </p>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(v) => formatAxisTime(String(v), range)}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: '#10b981' }}
                            />
                            <Tooltip labelFormatter={formatTooltipTime} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="co2"
                                name="CO₂ (ppm)"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="light"
                                name="Osvětlení (lx)"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="focusReadiness"
                                name="Focus Score (%)"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Tepelný a kožní komfort */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">
                        Tepelný a kožní komfort
                    </h3>
                    <p className="text-xs text-slate-500">
                        Teplota (°C), vlhkost (%) a Health & Comfort Index (%)
                    </p>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(v) => formatAxisTime(String(v), range)}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 11, fill: '#f97316' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: '#0ea5e9' }}
                            />
                            <Tooltip labelFormatter={formatTooltipTime} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="temperature"
                                name="Teplota (°C)"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="humidity"
                                name="Vlhkost (%)"
                                stroke="#0ea5e9"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="healthComfort"
                                name="Health & Comfort (%)"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Čistota vzduchu a tlak */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-slate-900">
                        Čistota vzduchu a tlak
                    </h3>
                    <p className="text-xs text-slate-500">
                        VOC (idx), PM₂.₅ (µg/m³) a atmosférický tlak (hPa)
                    </p>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(v) => formatAxisTime(String(v), range)}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <YAxis
                                yAxisId="left"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={['auto', 'auto']}
                                tick={{ fontSize: 11, fill: '#6366f1' }}
                            />
                            <Tooltip labelFormatter={formatTooltipTime} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="voc"
                                name="VOC (idx)"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="pm25"
                                name="PM₂.₅ (µg/m³)"
                                stroke="#ec4899"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="pressure"
                                name="Tlak (hPa)"
                                stroke="#6366f1"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}