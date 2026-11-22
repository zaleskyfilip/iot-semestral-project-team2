import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ServerOff } from 'lucide-react';
import { ApiError, api } from '../api/client';
import { ApiKeyPrompt } from '../components/ApiKeyPrompt';
import { AppHeader } from '../components/AppHeader';
import { StationCard } from '../components/StationCard';
import { useAuth } from '../context/AuthContext';
import type { Station } from '../types/atmodesq';

type StationFilter = 'ALL' | 'ONLINE' | 'OFFLINE';

interface StationsProps {
    initialFilter?: StationFilter;
}

export function Stations({ initialFilter = 'ALL' }: StationsProps) {
    const { apiKey, userRole, isAuthenticated } = useAuth();
    const [stations, setStations] = useState<Station[]>([]);
    const [filter, setFilter] = useState<StationFilter>(initialFilter);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [unauthorized, setUnauthorized] = useState(false);

    const loadStations = useCallback(async () => {
        if (!apiKey) return;
        setLoading(true);
        setError(null);
        setUnauthorized(false);
        try {
            const res = await api.getStations(apiKey);
            setStations(res.stations);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                setUnauthorized(true);
            } else {
                setError(
                    err instanceof Error ? err.message : 'Nepodařilo se načíst stanice.'
                );
            }
        } finally {
            setLoading(false);
        }
    }, [apiKey]);

    useEffect(() => {
        loadStations();
    }, [loadStations]);

    const filteredStations = stations.filter((s) =>
        filter === 'ALL' ? true : s.status === filter
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader userRole={userRole} />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                {!isAuthenticated || unauthorized ? (
                    <ApiKeyPrompt
                        message={
                            unauthorized
                                ? 'Zadaný API klíč byl zamítnut (401 Unauthorized). Zkontroluj ho prosím.'
                                : undefined
                        }
                        onSuccess={loadStations}
                    />
                ) : (
                    <>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Přehled stanic
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Vyber stanici Atmodesq pro zobrazení živého dashboardu a
                                    analytiky.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                                    {(['ALL', 'ONLINE', 'OFFLINE'] as StationFilter[]).map((f) => (
                                        <button
                                            key={f}
                                            type="button"
                                            onClick={() => setFilter(f)}
                                            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                                                filter === f
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {f === 'ALL' ? 'Vše' : f}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={loadStations}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <RefreshCw
                                        className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                                    />
                                    Obnovit
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        )}

                        {loading && stations.length === 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {[1, 2, 3].map((n) => (
                                    <div
                                        key={n}
                                        className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white"
                                    />
                                ))}
                            </div>
                        ) : filteredStations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                                <ServerOff className="mb-3 h-10 w-10 text-slate-400" />
                                <p className="text-base font-medium text-slate-700">
                                    {stations.length === 0
                                        ? 'Nemáte přiřazeny žádné stanice.'
                                        : 'Žádná stanice neodpovídá zvolenému filtru.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredStations.map((station) => (
                                    <StationCard
                                        key={station.id}
                                        station={station}
                                        userRole={userRole}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}