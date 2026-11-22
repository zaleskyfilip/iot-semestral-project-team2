import type {
    ControlActionPayload,
    ControlActionResponse,
    DashboardCurrentResponse,
    DeviceConfig,
    StationsResponse,
    TelemetryHistoryResponse,
    TimeRange,
    UpdateConfigPayload,
    UpdateConfigResponse,
} from '../types/atmodesq';

const API_BASE = '/api/v1';

export class ApiError extends Error {
    status: number;
    code: string;
    details?: unknown;

    constructor(status: number, code: string, message: string, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

async function request<T>(
    path: string,
    apiKey: string,
    init: RequestInit = {}
): Promise<T> {
    const headers = new Headers(init.headers);
    if (apiKey) {
        headers.set('x-api-key', apiKey);
    }
    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const code = data?.error?.code ?? 'httpError';
        const message = data?.error?.message ?? `Request failed (${res.status})`;
        throw new ApiError(res.status, code, message, data?.error?.details);
    }

    return data as T;
}

export const api = {
    getStations(apiKey: string) {
        return request<StationsResponse>('/stations', apiKey);
    },

    getCurrentDashboard(apiKey: string, stationId: string) {
        const params = new URLSearchParams({ stationId });
        return request<DashboardCurrentResponse>(
            `/dashboard/current?${params.toString()}`,
            apiKey
        );
    },

    getTelemetryHistory(apiKey: string, stationId: string, range: TimeRange) {
        const params = new URLSearchParams({ stationId, range });
        return request<TelemetryHistoryResponse>(
            `/telemetry/history?${params.toString()}`,
            apiKey
        );
    },

    getDeviceConfig(apiKey: string, stationId: string) {
        const params = new URLSearchParams({ stationId });
        return request<DeviceConfig>(`/config?${params.toString()}`, apiKey);
    },

    updateDeviceConfig(apiKey: string, payload: UpdateConfigPayload) {
        return request<UpdateConfigResponse>('/config', apiKey, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    sendControlAction(apiKey: string, payload: ControlActionPayload) {
        return request<ControlActionResponse>('/control/action', apiKey, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },
};