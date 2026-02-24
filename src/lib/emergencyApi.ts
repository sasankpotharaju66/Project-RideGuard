const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4001';

export type EmergencyReason = 'ROUTE_DEVIATION' | 'NO_MOVEMENT' | 'MANUAL_ALERT';

export interface EmergencyPayload {
    rideId: string;
    userId?: string;
    location: [number, number];
    reason: EmergencyReason;
    gender?: string;
    emergencyContacts?: { name: string; phone: string }[];
}

export interface GpsUpdatePayload {
    rideId: string;
    lat: number;
    lon: number;
    userId?: string;
}

export interface BatchLocationPayload {
    rideId: string;
    updates: Array<{ lat: number; lon: number; timestamp: number }>;
}

/**
 * Send a single GPS update to the server.
 * Runs deviation + no-movement detection server-side.
 */
export async function sendGpsUpdate(payload: GpsUpdatePayload): Promise<{
    ok: boolean;
    deviationMeters: number;
    noMovementMs: number;
    emergencyTriggered: boolean;
} | null> {
    try {
        const res = await fetch(`${API_BASE}/api/gps-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null; // caller handles offline case
    }
}

/**
 * Manually trigger an emergency alert.
 * Sends to emergency contacts; gender adds she_team / police routing.
 */
export async function triggerEmergency(payload: EmergencyPayload): Promise<{
    ok: boolean;
    throttled?: boolean;
    emergency?: object;
} | null> {
    try {
        const res = await fetch(`${API_BASE}/api/emergency/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null; // offline — caller should queue
    }
}

/**
 * Flush offline-cached GPS updates to the server (batch replay).
 */
export async function batchUploadLocations(payload: BatchLocationPayload): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE}/api/locations/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return res.ok;
    } catch {
        return false;
    }
}

/**
 * Fetch the emergency log for a ride.
 */
export async function getEmergencyLog(rideId: string) {
    try {
        const res = await fetch(`${API_BASE}/api/emergency/${rideId}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}
