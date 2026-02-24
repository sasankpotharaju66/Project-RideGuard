/**
 * offlineQueue.ts
 * ───────────────
 * Caches GPS updates and emergency alerts to localStorage when the device is offline.
 * On reconnect, flushes all queued items to the server.
 */

import { batchUploadLocations, triggerEmergency, type EmergencyPayload } from './emergencyApi';

const GPS_QUEUE_KEY = 'rg_gps_queue';
const ALERT_QUEUE_KEY = 'rg_alert_queue';

// ─────────────────────────────────────────────
// GPS Queue
// ─────────────────────────────────────────────

interface QueuedGps {
    rideId: string;
    lat: number;
    lon: number;
    timestamp: number;
}

export function queueGpsUpdate(rideId: string, lat: number, lon: number): void {
    const raw = localStorage.getItem(GPS_QUEUE_KEY);
    const queue: QueuedGps[] = raw ? JSON.parse(raw) : [];
    queue.push({ rideId, lat, lon, timestamp: Date.now() });
    // Keep last 500 points to avoid unbounded growth
    const trimmed = queue.slice(-500);
    localStorage.setItem(GPS_QUEUE_KEY, JSON.stringify(trimmed));
}

export function getQueuedGpsCount(): number {
    const raw = localStorage.getItem(GPS_QUEUE_KEY);
    if (!raw) return 0;
    try { return (JSON.parse(raw) as QueuedGps[]).length; } catch { return 0; }
}

async function flushGpsQueue(): Promise<void> {
    const raw = localStorage.getItem(GPS_QUEUE_KEY);
    if (!raw) return;
    let queue: QueuedGps[];
    try { queue = JSON.parse(raw); } catch { return; }
    if (queue.length === 0) return;

    // Group by rideId
    const byRide = new Map<string, Array<{ lat: number; lon: number; timestamp: number }>>();
    for (const item of queue) {
        const arr = byRide.get(item.rideId) ?? [];
        arr.push({ lat: item.lat, lon: item.lon, timestamp: item.timestamp });
        byRide.set(item.rideId, arr);
    }

    const successes: string[] = [];
    for (const [rideId, updates] of byRide) {
        const ok = await batchUploadLocations({ rideId, updates });
        if (ok) successes.push(rideId);
    }

    // Remove only successfully flushed items
    if (successes.length > 0) {
        const remaining = queue.filter((q) => !successes.includes(q.rideId));
        localStorage.setItem(GPS_QUEUE_KEY, JSON.stringify(remaining));
        console.log(`[offlineQueue] Flushed GPS for rides: ${successes.join(', ')}`);
    }
}

// ─────────────────────────────────────────────
// Alert Queue
// ─────────────────────────────────────────────

interface QueuedAlert extends EmergencyPayload {
    queuedAt: number;
}

export function queueEmergencyAlert(payload: EmergencyPayload): void {
    const raw = localStorage.getItem(ALERT_QUEUE_KEY);
    const queue: QueuedAlert[] = raw ? JSON.parse(raw) : [];
    queue.push({ ...payload, queuedAt: Date.now() });
    localStorage.setItem(ALERT_QUEUE_KEY, JSON.stringify(queue));
    console.log('[offlineQueue] Emergency alert queued (offline):', payload.reason);
}

export function getQueuedAlertCount(): number {
    const raw = localStorage.getItem(ALERT_QUEUE_KEY);
    if (!raw) return 0;
    try { return (JSON.parse(raw) as QueuedAlert[]).length; } catch { return 0; }
}

async function flushAlertQueue(): Promise<void> {
    const raw = localStorage.getItem(ALERT_QUEUE_KEY);
    if (!raw) return;
    let queue: QueuedAlert[];
    try { queue = JSON.parse(raw); } catch { return; }
    if (queue.length === 0) return;

    const remaining: QueuedAlert[] = [];
    for (const alert of queue) {
        const result = await triggerEmergency(alert);
        if (!result) remaining.push(alert); // keep if still failing
    }
    localStorage.setItem(ALERT_QUEUE_KEY, JSON.stringify(remaining));
    const flushed = queue.length - remaining.length;
    if (flushed > 0) console.log(`[offlineQueue] Flushed ${flushed} queued alert(s)`);
}

// ─────────────────────────────────────────────
// Master flush — called when navigator goes online
// ─────────────────────────────────────────────

export async function flushAllQueues(): Promise<void> {
    await flushAlertQueue();
    await flushGpsQueue();
}

/**
 * Register a one-time online event listener to auto-flush queues.
 * Safe to call multiple times — uses a module-level flag.
 */
let listenerRegistered = false;
export function registerOnlineFlush(): void {
    if (listenerRegistered) return;
    listenerRegistered = true;
    window.addEventListener('online', () => {
        console.log('[offlineQueue] Connection restored — flushing queues...');
        flushAllQueues();
    });
}
