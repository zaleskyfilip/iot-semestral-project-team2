import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Bell,
    LayoutDashboard,
    Leaf,
    LineChart,
    Lightbulb,
    LogOut,
    Server,
    Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    OPERATING_MODE_LABELS,
    type ConnectionStatus,
    type OperatingMode,
    type UserRole,
} from '../types/atmodesq';

interface AppHeaderProps {
    stationId?: string | null;
    stationName?: string;
    connectionStatus?: ConnectionStatus | null;
    operatingMode?: OperatingMode;
    userRole: UserRole;
    onModeChange?: (mode: OperatingMode) => Promise<void>;
    onTestAction?: (action: 'TEST_LED' | 'TEST_BUZZER') => Promise<void>;
}

const MODES: OperatingMode[] = [
    'DeepFocus',
    'StandardOffice',
    'VentilationAssist',
    'NightMode',
];

export function AppHeader({
                              stationId = null,
                              stationName = '',
                              connectionStatus = null,
                              operatingMode = 'StandardOffice',
                              userRole,
                              onModeChange,
                              onTestAction,
                          }: AppHeaderProps) {
    const location = useLocation();
    const { logout } = useAuth();
    const [isBusy, setIsBusy] = useState(false);

    const isOffline = connectionStatus === 'OFFLINE';

    const handleModeSelect = async (nextMode: OperatingMode) => {
        if (!onModeChange || isOffline || isBusy) return;
        setIsBusy(true);
        try {
            await onModeChange(nextMode);
        } finally {
            setIsBusy(false);
        }
    };

    const handleTest = async (action: 'TEST_LED' | 'TEST_BUZZER') => {
        if (!onTestAction || isOffline || isBusy) return;
        setIsBusy(true);
        try {
            await onTestAction(action);
        } finally {
            setIsBusy(false);
        }
    };

    const navLinkClass = (path: string) => {
        const active = location.pathname === path;
        return `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`;
    };

    return (
        <header className="border-b border-slate-800 bg-slate-900 text-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-4">
                    <Link
                        to="/stations"
                        className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
                    >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Leaf className="h-5 w-5" />
            </span>
                        Atmodesq
                    </Link>

                    {stationName && (
                        <span className="hidden text-sm text-slate-400 sm:inline">
              / <span className="font-medium text-slate-200">{stationName}</span>
            </span>
                    )}

                    {stationId && connectionStatus && (
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                connectionStatus === 'ONLINE'
                                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
                            }`}
                        >
              <span
                  className={`h-2 w-2 rounded-full ${
                      connectionStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
              />
                            {connectionStatus}
            </span>
                    )}
                </div>

                <nav className="flex flex-wrap items-center gap-1">
                    <Link to="/stations" className={navLinkClass('/stations')}>
                        <Server className="h-4 w-4" />
                        Stanice
                    </Link>

                    {stationId && (
                        <>
                            <Link
                                to={`/dashboard/${stationId}`}
                                className={navLinkClass(`/dashboard/${stationId}`)}
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                            <Link
                                to={`/dashboard/${stationId}/history`}
                                className={navLinkClass(`/dashboard/${stationId}/history`)}
                            >
                                <LineChart className="h-4 w-4" />
                                Historie
                            </Link>
                            {userRole === 'ADMIN' && (
                                <Link
                                    to={`/dashboard/${stationId}/settings`}
                                    className={navLinkClass(`/dashboard/${stationId}/settings`)}
                                >
                                    <Settings className="h-4 w-4" />
                                    Nastavení
                                </Link>
                            )}
                        </>
                    )}
                </nav>

                <div className="flex flex-wrap items-center gap-2">
                    {stationId && onModeChange && (
                        <select
                            aria-label="Provozní režim"
                            value={operatingMode}
                            disabled={isOffline || isBusy}
                            onChange={(e) => handleModeSelect(e.target.value as OperatingMode)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-100 focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {MODES.map((mode) => (
                                <option key={mode} value={mode}>
                                    {OPERATING_MODE_LABELS[mode]}
                                </option>
                            ))}
                        </select>
                    )}

                    {stationId && userRole === 'ADMIN' && onTestAction && (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={isOffline || isBusy}
                                onClick={() => handleTest('TEST_LED')}
                                title="Otestovat RGB LED na stanici"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                                Test LED
                            </button>
                            <button
                                type="button"
                                disabled={isOffline || isBusy}
                                onClick={() => handleTest('TEST_BUZZER')}
                                title="Prozvonit bzučák na stanici"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Bell className="h-3.5 w-3.5 text-sky-400" />
                                Beep
                            </button>
                        </div>
                    )}

                    <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
            {userRole}
          </span>

                    <button
                        type="button"
                        onClick={logout}
                        title="Změnit API klíč"
                        className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </header>
    );
}