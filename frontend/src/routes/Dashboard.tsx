import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { ApiError, api } from '../api/client';
import { ApiKeyPrompt } from '../components/ApiKeyPrompt';
import { AppHeader } from '../components/AppHeader';
import { ScoreGauge } from '../components/ScoreGauge';
import { SensorCard } from '../components/SensorCard';
import { SmartInsightsPanel } from '../components/SmartInsightsPanel';
import { useAuth } from '../context/AuthContext';
import {
    METRIC_LIST,
    type DashboardCurrentResponse,
    type DeviceConfig,
    type MetricKey,
    type OperatingMode,
    type TelemetryPoint,
} from '../types/atmodesq';

interface DashboardProps {
    refreshIntervalMs?: number;
}

export function Dashboard({ refreshIntervalMs = 15000 }: DashboardProps) {
    const { stationId = '' } = useParams<{ stationId: string }>();
    const { apiKey, userRole, isAuthenticated } = useAuth();

    const [stationName, setStationName] = useState('');
    const [current, setCurrent] = useState<DashboardCurrentResponse | null>(null);
    const [config, setConfig] = useState<DeviceConfig | null>(null);
    const [recentSeries, setRecentSeries] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [noTelemetryYet, setNoTelemetryYet] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        window.setTimeout(() => setToast(null), 3500);
    };

    const fetchDashboard = useCallback(
        async (isInitial = false) => {
            if (!apiKey || !stationId) return;
            if (isInitial) setLoading(true);
            setError(null);
            setUnauthorized(false);

            try {
                const [stationsRes, configRes, historyRes] = await Promise.all([
                    api.getStations(apiKey).catch(() => null),
                    api.getDeviceConfig(apiKey, stationId).catch(() => null),
                    api.getTelemetryHistory(apiKey, stationId, '24h').catch(() => null),
                ]);

                const matchedStation = stationsRes?.stations.find(
                    (s) => s.id === stationId
                );
                if (matchedStation) setStationName(matchedStation.name);
                if (configRes) setConfig(configRes);
                if (historyRes) setRecentSeries(historyRes.series);

                try {
                    const currentRes = await api.getCurrentDashboard(apiKey, stationId);
                    setCurrent(currentRes);
                    setNoTelemetryYet(false);
                } catch (err) {
                    if (err instanceof ApiError && err.code === 'telemetryNotFound') {
                        setCurrent(null);
                        setNoTelemetryYet(true);
                    } else {
                        throw err;
                    }
                }
            } catch (err) {
                if (err instanceof ApiError && err.status === 401) {
                    setUnauthorized(true);
                } else {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Nepodařilo se načíst aktuální stav stanice.'
                    );
                }
            } finally {
                setLoading(false);
            }
        },
        [apiKey, stationId]
    );

    useEffect(() => {
        fetchDashboard(true);
        const id = window.setInterval(() => fetchDashboard(false), refreshIntervalMs);
        return () => window.clearInterval(id);
    }, [fetchDashboard, refreshIntervalMs]);

    const handleModeChange = async (mode: OperatingMode) => {
        try {
            await api.sendControlAction(apiKey, {
                stationId,
                action: 'SET_MODE',
                payload: { mode },
            });
            showToast(`Příkaz pro přepnutí režimu na ${mode} byl zařazen.`);
            await fetchDashboard(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Změna režimu selhala.');
        }
    };

    const handleTestAction = async (action: 'TEST_LED' | 'TEST_BUZZER') => {
        try {
            await api.sendControlAction(apiKey, { stationId, action });
            showToast(
                action === 'TEST_LED'
                    ? 'Test RGB LED byl odeslán stanici.'
                    : 'Test bzučáku byl odeslán stanici.'
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Odeslání testu selhalo.');
        }
    };

    const getSparklineAndTrend = (key: MetricKey) => {
        const values = recentSeries
            .map((point) => point[key])
            .filter((v): v is number => typeof v === 'number');
        // 24h historie má 15min buckety -> 5 bodů ~ 1 hodina, poslední 2 body ~ 15 min trend
        const sparkline1h = values.slice(-6);
        const trend15m =
            values.length >= 2
                ? values[values.length - 1] - values[values.length - 2]
                : null;
        return { sparkline1h, trend15m };
    };

    const activeMode = current?.mode ?? config?.operatingMode ?? 'StandardOffice';

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader
                stationId={stationId}
                stationName={stationName}
                connectionStatus={current?.connectionStatus ?? null}
                operatingMode={activeMode}
                userRole={userRole}
                onModeChange={handleModeChange}
                onTestAction={handleTestAction}
            />

            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
                {!isAuthenticated || unauthorized ? (
                    <ApiKeyPrompt
                        message={
                            unauthorized
                                ? 'Chybějící nebo neplatný API klíč (401 Unauthorized).'
                                : undefined
                        }
                        onSuccess={() => fetchDashboard(true)}
                    />
                ) : (
                    <>
                        {toast && (
                            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                {toast}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {current?.connectionStatus === 'OFFLINE' && (
                            <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>
                  Stanice je aktuálně <strong>OFFLINE</strong>. Poslední data
                  dorazila{' '}
                                    <strong>
                    {new Date(current.lastUpdate).toLocaleString('cs-CZ')}
                  </strong>
                  .
                </span>
                            </div>
                        )}

                        {noTelemetryYet && !loading && (
                            <div className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-600">
                                Tato stanice zatím neodeslala žádný telemetrický záznam. Spusť
                                fyzickou stanici nebo skript <code>scripts/fake-station.js</code>.
                            </div>
                        )}

                        <section className="grid gap-4 lg:grid-cols-3">
                            <ScoreGauge
                                title="Focus Readiness Score"
                                value={current?.scores.focusReadiness ?? null}
                                loading={loading}
                            />
                            <ScoreGauge
                                title="Health & Comfort Index"
                                value={current?.scores.healthComfort ?? null}
                                loading={loading}
                            />
                            <SmartInsightsPanel
                                insights={current?.insights ?? []}
                                lastUpdate={current?.lastUpdate ?? null}
                                loading={loading}
                            />
                        </section>

                        <section>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
                                Aktuální měření senzorů
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {METRIC_LIST.map((meta) => {
                                    const reading = current?.metrics[meta.key];
                                    const { sparkline1h, trend15m } = getSparklineAndTrend(
                                        meta.key
                                    );
                                    const thresholds =
                                        meta.key === 'co2' && config
                                            ? {
                                                warn: config.thresholds.co2Warn,
                                                crit: config.thresholds.co2Crit,
                                            }
                                            : null;

                                    return (
                                        <SensorCard
                                            key={meta.key}
                                            metricKey={meta.key}
                                            label={meta.label}
                                            unit={meta.unit}
                                            value={reading?.value ?? null}
                                            state={reading?.state ?? 'IGNORED'}
                                            mask={config?.masks[meta.key] ?? 'ACTIVE'}
                                            trend15m={trend15m}
                                            sparkline1h={sparkline1h}
                                            thresholds={thresholds}
                                        />
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}