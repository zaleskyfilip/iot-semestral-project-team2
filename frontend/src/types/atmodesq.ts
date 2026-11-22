export type UserRole = 'USER' | 'ADMIN';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE';
export type OperatingMode =
    | 'DeepFocus'
    | 'StandardOffice'
    | 'VentilationAssist'
    | 'NightMode';

export type MetricKey =
    | 'co2'
    | 'voc'
    | 'pm25'
    | 'temperature'
    | 'humidity'
    | 'light'
    | 'pressure';

export type MetricState = 'OK' | 'WARN' | 'CRIT' | 'IGNORED';
export type SensorMask = 'ACTIVE' | 'MONITOR_ONLY' | 'DISABLED';
export type TimeRange = '24h' | '7d' | '30d';
export type ControlAction = 'SET_MODE' | 'TEST_LED' | 'TEST_BUZZER';

export interface Station {
    id: string;
    name: string;
    status: ConnectionStatus;
    lastSeenAt: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface StationsResponse {
    stations: Station[];
}

export interface MetricReading {
    value: number;
    state: MetricState;
}

export interface DashboardCurrentResponse {
    stationId: string;
    mode: OperatingMode;
    connectionStatus: ConnectionStatus;
    lastUpdate: string;
    scores: {
        focusReadiness: number;
        healthComfort: number;
    };
    metrics: Record<MetricKey, MetricReading>;
    insights: string[];
}

export interface KpiStats {
    averageFocusScore: number | null;
    optimalCo2Percentage: number | null;
    ventilationCount: number;
}

export interface TelemetryPoint {
    timestamp: string;
    co2: number | null;
    voc: number | null;
    pm25: number | null;
    temperature: number | null;
    humidity: number | null;
    light: number | null;
    pressure: number | null;
    focusReadiness: number | null;
    healthComfort: number | null;
}

export interface TelemetryHistoryResponse {
    stationId: string;
    range: TimeRange;
    kpi: KpiStats;
    series: TelemetryPoint[];
}

export interface ScheduleInterval {
    from: string;
    to: string;
    mode: OperatingMode;
}

export interface DeviceConfig {
    stationId: string;
    operatingMode: OperatingMode;
    masks: Record<MetricKey, SensorMask>;
    thresholds: {
        co2Warn: number;
        co2Crit: number;
    };
    schedule: ScheduleInterval[];
}

export interface UpdateConfigPayload {
    stationId: string;
    operatingMode?: OperatingMode;
    masks?: Partial<Record<MetricKey, SensorMask>>;
    thresholds?: {
        co2Warn: number;
        co2Crit: number;
    };
    schedule?: ScheduleInterval[];
}

export interface UpdateConfigResponse {
    status: string;
    configId: string;
}

export interface ControlActionPayload {
    stationId: string;
    action: ControlAction;
    payload?: {
        mode?: OperatingMode;
    };
}

export interface ControlActionResponse {
    status: string;
    commandId: string;
}

export interface MetricMeta {
    key: MetricKey;
    label: string;
    unit: string;
}

export const METRIC_LIST: MetricMeta[] = [
    { key: 'co2', label: 'CO₂', unit: 'ppm' },
    { key: 'voc', label: 'VOC', unit: 'idx' },
    { key: 'pm25', label: 'PM₂.₅', unit: 'µg/m³' },
    { key: 'temperature', label: 'Teplota', unit: '°C' },
    { key: 'humidity', label: 'Vlhkost', unit: '%' },
    { key: 'light', label: 'Osvětlení', unit: 'lx' },
    { key: 'pressure', label: 'Tlak', unit: 'hPa' },
];

export const OPERATING_MODE_LABELS: Record<OperatingMode, string> = {
    DeepFocus: 'Deep Focus',
    StandardOffice: 'Standard Office',
    VentilationAssist: 'Ventilation Assist',
    NightMode: 'Night Mode',
};