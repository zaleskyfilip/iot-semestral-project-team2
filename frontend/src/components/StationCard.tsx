import { Link } from 'react-router-dom';
import { Clock, LayoutDashboard, LineChart, Settings } from 'lucide-react';
import type { Station, UserRole } from '../types/atmodesq';

interface StationCardProps {
    station: Station;
    userRole: UserRole;
    onSelect?: (stationId: string) => void;
}

function formatDateTime(iso: string | null): string {
    if (!iso) return 'Nikdy';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('cs-CZ');
}

export function StationCard({ station, userRole, onSelect }: StationCardProps) {
    const isOnline = station.status === 'ONLINE';

    return (
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            {station.name}
                        </h3>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">
                            {station.id}
                        </p>
                    </div>

                    <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isOnline
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                        }`}
                    >
            <span
                className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-emerald-500' : 'bg-rose-400'
                }`}
            />
                        {station.status}
          </span>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    Poslední kontakt: {formatDateTime(station.lastSeenAt)}
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                    to={`/dashboard/${station.id}`}
                    onClick={() => onSelect?.(station.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                </Link>

                <Link
                    to={`/dashboard/${station.id}/history`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    <LineChart className="h-3.5 w-3.5" />
                    Historie
                </Link>

                {userRole === 'ADMIN' && (
                    <Link
                        to={`/dashboard/${station.id}/settings`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        Nastavení
                    </Link>
                )}
            </div>
        </div>
    );
}