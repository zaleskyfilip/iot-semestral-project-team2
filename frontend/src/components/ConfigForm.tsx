import { useEffect, useState, type FormEvent } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    Save,
    Trash2,
} from 'lucide-react';
import {
    METRIC_LIST,
    OPERATING_MODE_LABELS,
    type DeviceConfig,
    type MetricKey,
    type OperatingMode,
    type ScheduleInterval,
    type SensorMask,
    type UpdateConfigPayload,
} from '../types/atmodesq';

export type SyncStatus =
    | 'IDLE'
    | 'SAVED'
    | 'PENDING_STATION'
    | 'CONFIRMED'
    | 'ERROR';

interface ConfigFormProps {
    initialConfig: DeviceConfig;
    isSaving: boolean;
    syncStatus: SyncStatus;
    onSubmit: (payload: UpdateConfigPayload) => Promise<void>;
}

const MODES: OperatingMode[] = [
    'DeepFocus',
    'StandardOffice',
    'VentilationAssist',
    'NightMode',
];

const MAX_SCHEDULE_INTERVALS = 10;

function normalizeMasks(
    masks: Record<MetricKey, SensorMask>
): Record<MetricKey, 'ACTIVE' | 'MONITOR_ONLY'> {
    return {
        co2: masks.co2 === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
        voc: masks.voc === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
        pm25: masks.pm25 === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
        temperature:
            masks.temperature === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
        humidity: masks.humidity === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
        light: masks.light === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
        pressure: masks.pressure === 'MONITOR_ONLY' ? 'MONITOR_ONLY' : 'ACTIVE',
    };
}

export function ConfigForm({
                               initialConfig,
                               isSaving,
                               syncStatus,
                               onSubmit,
                           }: ConfigFormProps) {
    const [operatingMode, setOperatingMode] = useState<OperatingMode>(
        initialConfig.operatingMode
    );
    const [masks, setMasks] = useState<Record<MetricKey, 'ACTIVE' | 'MONITOR_ONLY'>>(
        () => normalizeMasks(initialConfig.masks)
    );
    const [co2Warn, setCo2Warn] = useState<number>(initialConfig.thresholds.co2Warn);
    const [co2Crit, setCo2Crit] = useState<number>(initialConfig.thresholds.co2Crit);
    const [schedule, setSchedule] = useState<ScheduleInterval[]>(
        initialConfig.schedule
    );

    useEffect(() => {
        setOperatingMode(initialConfig.operatingMode);
        setMasks(normalizeMasks(initialConfig.masks));
        setCo2Warn(initialConfig.thresholds.co2Warn);
        setCo2Crit(initialConfig.thresholds.co2Crit);
        setSchedule(initialConfig.schedule);
    }, [initialConfig]);

    const thresholdsValid =
        Number.isInteger(co2Warn) &&
        Number.isInteger(co2Crit) &&
        co2Warn >= 1 &&
        co2Crit >= 1 &&
        co2Warn < co2Crit;

    const scheduleValid =
        schedule.length <= MAX_SCHEDULE_INTERVALS &&
        schedule.every(
            (item) =>
                Boolean(item.from) &&
                Boolean(item.to) &&
                MODES.includes(item.mode)
        );

    const isDirty =
        operatingMode !== initialConfig.operatingMode ||
        co2Warn !== initialConfig.thresholds.co2Warn ||
        co2Crit !== initialConfig.thresholds.co2Crit ||
        JSON.stringify(masks) !==
        JSON.stringify(normalizeMasks(initialConfig.masks)) ||
        JSON.stringify(schedule) !== JSON.stringify(initialConfig.schedule);

    const canSubmit = isDirty && thresholdsValid && scheduleValid && !isSaving;

    const handleMaskChange = (
        key: MetricKey,
        value: 'ACTIVE' | 'MONITOR_ONLY'
    ) => {
        setMasks((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddInterval = () => {
        if (schedule.length >= MAX_SCHEDULE_INTERVALS) return;
        setSchedule((prev) => [
            ...prev,
            { from: '08:00', to: '17:00', mode: 'StandardOffice' },
        ]);
    };

    const handleUpdateInterval = (
        index: number,
        patch: Partial<ScheduleInterval>
    ) => {
        setSchedule((prev) =>
            prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
        );
    };

    const handleRemoveInterval = (index: number) => {
        setSchedule((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        await onSubmit({
            stationId: initialConfig.stationId,
            operatingMode,
            masks,
            thresholds: {
                co2Warn,
                co2Crit,
            },
            schedule,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provozní režim */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">
                            Provozní režim stanice
                        </h2>
                        <p className="text-xs text-slate-500">
                            Určuje výchozí chování signalizace a hodnocení stanice.
                        </p>
                    </div>
                    <select
                        value={operatingMode}
                        onChange={(e) => setOperatingMode(e.target.value as OperatingMode)}
                        className="min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                        {MODES.map((mode) => (
                            <option key={mode} value={mode}>
                                {OPERATING_MODE_LABELS[mode]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Maskování senzorů */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                        Maskování senzorů
                    </h2>
                    <p className="mb-4 text-xs text-slate-500">
                        Zvol, které veličiny aktivně ovlivňují skóre (`ACTIVE`) nebo se jen
                        sledují (`MONITOR_ONLY`).
                    </p>

                    <div className="divide-y divide-slate-100">
                        {METRIC_LIST.map((metric) => (
                            <div
                                key={metric.key}
                                className="flex items-center justify-between gap-3 py-2.5"
                            >
                <span className="text-sm font-medium text-slate-700">
                  {metric.label}
                </span>
                                <select
                                    value={masks[metric.key]}
                                    onChange={(e) =>
                                        handleMaskChange(
                                            metric.key,
                                            e.target.value as 'ACTIVE' | 'MONITOR_ONLY'
                                        )
                                    }
                                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="MONITOR_ONLY">MONITOR_ONLY</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Časový rozvrh */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Časový rozvrh
                            </h2>
                            <p className="text-xs text-slate-500">
                                Automatické přepínání režimů ({schedule.length}/
                                {MAX_SCHEDULE_INTERVALS}).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddInterval}
                            disabled={schedule.length >= MAX_SCHEDULE_INTERVALS}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Přidat
                        </button>
                    </div>

                    {schedule.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                            Žádné naplánované intervaly.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {schedule.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                                >
                                    <div className="mb-2 flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={item.from}
                                            onChange={(e) =>
                                                handleUpdateInterval(idx, { from: e.target.value })
                                            }
                                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                                            required
                                        />
                                        <span className="text-xs text-slate-400">–</span>
                                        <input
                                            type="time"
                                            value={item.to}
                                            onChange={(e) =>
                                                handleUpdateInterval(idx, { to: e.target.value })
                                            }
                                            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveInterval(idx)}
                                            title="Odebrat interval"
                                            className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <select
                                        value={item.mode}
                                        onChange={(e) =>
                                            handleUpdateInterval(idx, {
                                                mode: e.target.value as OperatingMode,
                                            })
                                        }
                                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                                    >
                                        {MODES.map((mode) => (
                                            <option key={mode} value={mode}>
                                                {OPERATING_MODE_LABELS[mode]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Prahové meze CO2 */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                        Prahové meze CO₂
                    </h2>
                    <p className="mb-4 text-xs text-slate-500">
                        Mezní hodnoty (v ppm) pro vyhodnocení varování a kritického stavu.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="co2-warn"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-700"
                            >
                                Varování — WARN (ppm)
                            </label>
                            <input
                                id="co2-warn"
                                type="number"
                                min={1}
                                step={1}
                                value={Number.isNaN(co2Warn) ? '' : co2Warn}
                                onChange={(e) => setCo2Warn(parseInt(e.target.value, 10))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="co2-crit"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-rose-700"
                            >
                                Kritický stav — CRIT (ppm)
                            </label>
                            <input
                                id="co2-crit"
                                type="number"
                                min={1}
                                step={1}
                                value={Number.isNaN(co2Crit) ? '' : co2Crit}
                                onChange={(e) => setCo2Crit(parseInt(e.target.value, 10))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                                required
                            />
                        </div>

                        {!thresholdsValid && (
                            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                  Hodnota <strong>WARN</strong> musí být celé kladné číslo menší
                  než <strong>CRIT</strong>.
                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Patička formuláře a SyncStatusPanel */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Ukládám...' : 'Uložit nastavení'}
                </button>

                {syncStatus !== 'IDLE' && (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        {syncStatus === 'ERROR' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-rose-700 ring-1 ring-rose-200">
                <AlertCircle className="h-3.5 w-3.5" />
                Chyba při ukládání konfigurace
              </span>
                        ) : (
                            <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Uloženo na backendu
                </span>
                                {syncStatus === 'PENDING_STATION' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-amber-700 ring-1 ring-amber-200">
                    <Clock className="h-3.5 w-3.5" />
                    Čeká na načtení stanicí
                  </span>
                                )}
                                {syncStatus === 'CONFIRMED' && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-sky-700 ring-1 ring-sky-200">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Potvrzeno stanicí
                  </span>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </form>
    );
}