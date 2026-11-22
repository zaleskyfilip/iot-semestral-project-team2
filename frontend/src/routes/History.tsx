import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ApiError, api } from '../api/client';
import { ApiKeyPrompt } from '../components/ApiKeyPrompt';
import { AppHeader } from '../components/AppHeader';
import { KpiSummaryBar } from '../components/KpiSummaryBar';
import { TelemetryChartGroup } from '../components/TelemetryChartGroup';
import { useAuth } from '../context/AuthContext';
import type {
    ConnectionStatus,
    TelemetryHistoryResponse,
    TimeRange,
} from '../types/atmodesq';

interface HistoryProps {
    defaultRange?: TimeRange;
}

const RANGES: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24 hodin' },
    { value: '7d', label: '7 dní' },
    { value: '30d', label: '30 dní' },
];

export function History({ defaultRange = '7d' }: HistoryProps) {
    const { stationId = '' } = useParams<{ stationId: string }>();
    const { apiKey, userRole, isAuthenticated } = useAuth();

    const [range, setRange] = useState<TimeRange>(defaultRange);
    const [stationName, setStationName] = useState('');
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus | null>(null);
    const [history, setHistory] = useState<TelemetryHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        if (!apiKey || !stationId) return;
        setLoading(true);
        setError(null);
        setUnauthorized(false);

        try {
            const [stationsRes, historyRes] = await Promise.all([
                api.getStations(apiKey).catch(() => null),
                api.getTelemetryHistory(apiKey, stationId, range),
            ]);

            const matched = stationsRes?.stations.find((s) => s.id === stationId);
            if (matched) {
                setStationName(matched.name);
                setConnectionStatus(matched.status);
            }

            setHistory(historyRes);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setUnauthorized(true);
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Nepodařilo se načíst historická data.'
                );
            }
        } finally {
            setLoading(false);
        }
    }, [apiKey, stationId, range]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader
                stationId={stationId}
                stationName={stationName}
                connectionStatus={connectionStatus}
                userRole={userRole}
            />

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
                {!isAuthenticated || unauthorized ? (
                    <ApiKeyPrompt
                        message={
                            unauthorized
                                ? 'Chybějící nebo neplatný API klíč (401 Unauthorized).'
                                : undefined
                        }
                        onSuccess={loadHistory}
                    />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Historie a analytika
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Dlouhodobé trendy mikroklimatu a souhrnné KPI statistiky.
                                </p>
                            </div>

                            {/* TimeRangeSelector */}
                            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                {RANGES.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        disabled={loading}
                                        onClick={() => setRange(item.value)}
                                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                            range === item.value
                                                ? 'bg-emerald-600 text-white'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                </span>
                                <button
                                    type="button"
                                    onClick={loadHistory}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Zkusit znovu
                                </button>
                            </div>
                        )}

                        <KpiSummaryBar
                            averageFocusScore={history?.kpi.averageFocusScore ?? null}
                            optimalCo2Percentage={history?.kpi.optimalCo2Percentage ?? null}
                            ventilationCount={history?.kpi.ventilationCount ?? 0}
                            range={range}
                            loading={loading}
                        />

                        <TelemetryChartGroup
                            series={history?.series ?? []}
                            range={range}
                            loading={loading}
                        />
                    </>
                )}
            </main>
        </div>
    );
}