import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    Lightbulb,
    ShieldAlert,
} from 'lucide-react';
import { ApiError, api } from '../api/client';
import { ApiKeyPrompt } from '../components/ApiKeyPrompt';
import { AppHeader } from '../components/AppHeader';
import { ConfigForm, type SyncStatus } from '../components/ConfigForm';
import { useAuth } from '../context/AuthContext';
import type {
    ConnectionStatus,
    DeviceConfig,
    UpdateConfigPayload,
} from '../types/atmodesq';

export function Settings() {
    const { stationId = '' } = useParams<{ stationId: string }>();
    const { apiKey, userRole, isAuthenticated } = useAuth();

    const [stationName, setStationName] = useState('');
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus | null>(null);
    const [config, setConfig] = useState<DeviceConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
    const [unauthorized, setUnauthorized] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const loadConfig = useCallback(async () => {
        if (!apiKey || !stationId || userRole !== 'ADMIN') return;
        setLoading(true);
        setError(null);
        setUnauthorized(false);
        setForbidden(false);

        try {
            const [stationsRes, configRes] = await Promise.all([
                api.getStations(apiKey).catch(() => null),
                api.getDeviceConfig(apiKey, stationId),
            ]);

            const matched = stationsRes?.stations.find((s) => s.id === stationId);
            if (matched) {
                setStationName(matched.name);
                setConnectionStatus(matched.status);
            }

            setConfig(configRes);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setUnauthorized(true);
            } else if (err instanceof ApiError && err.status === 403) {
                setForbidden(true);
            } else {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Nepodařilo se načíst konfiguraci stanice.'
                );
            }
        } finally {
            setLoading(false);
        }
    }, [apiKey, stationId, userRole]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSave = async (payload: UpdateConfigPayload) => {
        setIsSaving(true);
        setError(null);
        try {
            await api.updateDeviceConfig(apiKey, payload);
            const updated = await api.getDeviceConfig(apiKey, stationId);
            setConfig(updated);
            setSyncStatus('PENDING_STATION');
        } catch (err) {
            setSyncStatus('ERROR');
            if (err instanceof ApiError && err.status === 403) {
                setForbidden(true);
            } else {
                setError(
                    err instanceof Error ? err.message : 'Uložení konfigurace selhalo.'
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleActuatorTest = async (action: 'TEST_LED' | 'TEST_BUZZER') => {
        setIsTesting(true);
        setError(null);
        setActionMessage(null);
        try {
            const res = await api.sendControlAction(apiKey, { stationId, action });
            setActionMessage(
                action === 'TEST_LED'
                    ? `Příkaz Test LED zařazen (ID: ${res.commandId}).`
                    : `Příkaz Test bzučáku zařazen (ID: ${res.commandId}).`
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Odeslání testovacího příkazu selhalo.'
            );
        } finally {
            setIsTesting(false);
        }
    };

    const isOffline = connectionStatus === 'OFFLINE';

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader
                stationId={stationId}
                stationName={stationName}
                connectionStatus={connectionStatus}
                operatingMode={config?.operatingMode ?? 'StandardOffice'}
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
                        onSuccess={loadConfig}
                    />
                ) : userRole !== 'ADMIN' || forbidden ? (
                    <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                        <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-rose-500" />
                        <h1 className="text-xl font-bold text-slate-900">
                            Přístup odepřen (403)
                        </h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Nastavení stanice, prahové meze a testy aktuátorů může upravovat
                            pouze profil <strong>ADMIN</strong>.
                        </p>
                        <Link
                            to={`/dashboard/${stationId}`}
                            className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                            Zpět na Dashboard
                        </Link>
                    </div>
                ) : (
                    <>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Nastavení a rozvrh
                            </h1>
                            <p className="text-sm text-slate-500">
                                Vzdálená konfigurace provozního režimu, maskování senzorů,
                                prahů CO₂ a denního rozvrhu.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {loading || !config ? (
                            <div className="space-y-4">
                                <div className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                                <div className="grid gap-6 lg:grid-cols-3">
                                    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                                    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                                    <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <ConfigForm
                                    initialConfig={config}
                                    isSaving={isSaving}
                                    syncStatus={syncStatus}
                                    onSubmit={handleSave}
                                />

                                {/* ActuatorTestControls */}
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">
                                                Test aktuátorů stanice
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Ověř funkčnost lokální RGB LED diody a bzučáku na
                                                fyzické stanici.
                                                {isOffline &&
                                                    ' (Stanice je OFFLINE — testy jsou dočasně zakázány.)'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={isOffline || isTesting}
                                                onClick={() => handleActuatorTest('TEST_LED')}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Lightbulb className="h-4 w-4 text-amber-500" />
                                                Test LED
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isOffline || isTesting}
                                                onClick={() => handleActuatorTest('TEST_BUZZER')}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Bell className="h-4 w-4 text-sky-500" />
                                                Test bzučáku
                                            </button>
                                        </div>
                                    </div>

                                    {actionMessage && (
                                        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            {actionMessage}
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}