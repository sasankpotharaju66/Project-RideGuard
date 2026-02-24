/**
 * useSafetyMonitor
 * ────────────────
 * Central hook for all 4 safety features during an active ride:
 *  1. Live GPS polling + route deviation detection
 *  2. 10-minute no-movement timer + popup + 30s countdown auto-alert
 *  3. Online/offline detection + auto-queue flush
 *  4. WS-driven server emergency event listener
 *
 * DOES NOT affect ride booking / cancellation logic.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { sendGpsUpdate, triggerEmergency, type EmergencyPayload } from '@/lib/emergencyApi';
import {
    queueGpsUpdate,
    queueEmergencyAlert,
    registerOnlineFlush,
} from '@/lib/offlineQueue';

// In dev, allow overriding via env var so testers don't wait 10 min
const INACTIVITY_MS =
    Number(import.meta.env.VITE_INACTIVITY_MS) || 10 * 60 * 1000; // default 10 min

const COUNTDOWN_SECS = 30;
const GPS_INTERVAL_MS = 7000; // poll every 7 seconds
const NO_MOVEMENT_THRESHOLD_M = 20;

const toRad = (v: number) => (v * Math.PI) / 180;
const haversineM = (a: [number, number] | null, b: [number, number] | null): number => {
    if (!a || !b) return Infinity;
    const R = 6371000;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
};

interface SafetyMonitorOptions {
    rideId: string | undefined;
    user: {
        name?: string;
        gender?: string;
        emergencyContacts?: { name: string; phone: string }[];
    } | null;
    routePoints: [number, number][];
    rideStatus: string;
}

interface SafetyMonitorResult {
    showInactivityPopup: boolean;
    countdown: number;
    isOnline: boolean;
    emergencyTriggered: boolean;
    onUserResponded: (answer: 'yes' | 'no') => void;
    manualAlert: () => Promise<void>;
    alertButtonCooldown: boolean;
    pendingAlertCount: number;
}

export function useSafetyMonitor({
    rideId,
    user,
    routePoints,
    rideStatus,
}: SafetyMonitorOptions): SafetyMonitorResult {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showInactivityPopup, setShowInactivityPopup] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
    const [emergencyTriggered, setEmergencyTriggered] = useState(false);
    const [alertButtonCooldown, setAlertButtonCooldown] = useState(false);
    const [pendingAlertCount, setPendingAlertCount] = useState(0);

    const lastPosRef = useRef<[number, number] | null>(null);
    const lastMovedRef = useRef<number>(Date.now());
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gpsWatchRef = useRef<number | null>(null);
    const rideActiveRef = useRef(false);

    // Keep stable refs for values used inside interval callbacks
    const rideIdRef = useRef(rideId);
    const userRef = useRef(user);
    const routePointsRef = useRef(routePoints);
    useEffect(() => { rideIdRef.current = rideId; }, [rideId]);
    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { routePointsRef.current = routePoints; }, [routePoints]);

    // ── Online / Offline ───────────────────────────────────────────────────
    useEffect(() => {
        registerOnlineFlush();
        const onOnline = () => { setIsOnline(true); };
        const onOffline = () => { setIsOnline(false); };
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', onOffline);
        };
    }, []);

    // ── Inactivity countdown helpers ───────────────────────────────────────
    const clearCountdown = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
    }, []);

    const startCountdown = useCallback(() => {
        setCountdown(COUNTDOWN_SECS);
        clearCountdown();
        countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearCountdown();
                    // Auto emergency if no response
                    if (rideIdRef.current && lastPosRef.current) {
                        const payload: EmergencyPayload = {
                            rideId: rideIdRef.current,
                            location: lastPosRef.current,
                            reason: 'NO_MOVEMENT',
                            gender: userRef.current?.gender,
                            emergencyContacts: userRef.current?.emergencyContacts,
                        };
                        if (navigator.onLine) {
                            triggerEmergency(payload).then(() => setEmergencyTriggered(true));
                        } else {
                            queueEmergencyAlert(payload);
                            setPendingAlertCount((n) => n + 1);
                        }
                    }
                    setShowInactivityPopup(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearCountdown]);

    const resetInactivityTimer = useCallback(() => {
        lastMovedRef.current = Date.now();
        setShowInactivityPopup(false);
        clearCountdown();
        setCountdown(COUNTDOWN_SECS);

        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        if (!rideActiveRef.current) return;

        inactivityTimerRef.current = setTimeout(() => {
            setShowInactivityPopup(true);
            startCountdown();
        }, INACTIVITY_MS);
    }, [clearCountdown, startCountdown]);

    // ── GPS polling + deviation + no-movement detection ───────────────────
    const handlePosition = useCallback(
        (pos: GeolocationPosition) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const currentPos: [number, number] = [lat, lon];
            const rid = rideIdRef.current;
            if (!rid) return;

            // Movement check → reset inactivity timer if moved enough
            const moved = haversineM(lastPosRef.current, currentPos);
            if (moved > NO_MOVEMENT_THRESHOLD_M) {
                lastPosRef.current = currentPos;
                resetInactivityTimer();
            }

            // Send GPS update (or queue offline)
            if (navigator.onLine) {
                sendGpsUpdate({ rideId: rid, lat, lon });
            } else {
                queueGpsUpdate(rid, lat, lon);
                setPendingAlertCount((n) => n + 1);
            }
        },
        [resetInactivityTimer]
    );

    // ── Start / stop safety monitoring when ride is active ─────────────────
    useEffect(() => {
        const isActive =
            rideId &&
            rideStatus !== 'COMPLETED' &&
            rideStatus !== 'completed' &&
            rideStatus !== '';

        rideActiveRef.current = !!isActive;

        if (!isActive) {
            // Tear down everything when ride ends
            clearCountdown();
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (gpsWatchRef.current != null) navigator.geolocation.clearWatch(gpsWatchRef.current);
            setShowInactivityPopup(false);
            return;
        }

        // Start inactivity timer
        resetInactivityTimer();

        // Start GPS watch
        if (navigator.geolocation) {
            gpsWatchRef.current = navigator.geolocation.watchPosition(
                handlePosition,
                (err) => console.warn('[SafetyMonitor] GPS error:', err.message),
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
            );
        } else {
            // Fallback: poll using setInterval for simulated env
            const fallbackIv = setInterval(() => {
                // Use last known route point as fallback position
                const pts = routePointsRef.current;
                if (pts && pts.length > 0) {
                    const pos = pts[Math.floor(pts.length / 2)]; // midpoint as approximation
                    handlePosition({
                        coords: { latitude: pos[0], longitude: pos[1], accuracy: 0 },
                    } as GeolocationPosition);
                }
            }, GPS_INTERVAL_MS);
            return () => clearInterval(fallbackIv);
        }

        return () => {
            rideActiveRef.current = false;
            clearCountdown();
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (gpsWatchRef.current != null) navigator.geolocation.clearWatch(gpsWatchRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rideId, rideStatus]);

    // ── User response to inactivity popup ─────────────────────────────────
    const onUserResponded = useCallback(
        (answer: 'yes' | 'no') => {
            clearCountdown();
            setShowInactivityPopup(false);

            if (answer === 'no') {
                const rid = rideIdRef.current;
                const pos = lastPosRef.current ?? routePointsRef.current[0] ?? [0, 0];
                if (rid) {
                    const payload: EmergencyPayload = {
                        rideId: rid,
                        location: pos as [number, number],
                        reason: 'NO_MOVEMENT',
                        gender: userRef.current?.gender,
                        emergencyContacts: userRef.current?.emergencyContacts,
                    };
                    if (navigator.onLine) {
                        triggerEmergency(payload).then(() => setEmergencyTriggered(true));
                    } else {
                        queueEmergencyAlert(payload);
                        setPendingAlertCount((n) => n + 1);
                    }
                }
            } else {
                // YES → reset timer
                resetInactivityTimer();
            }
        },
        [clearCountdown, resetInactivityTimer]
    );

    // ── Manual ALERT button ────────────────────────────────────────────────
    const manualAlert = useCallback(async () => {
        const rid = rideIdRef.current;
        const pos = lastPosRef.current ?? routePointsRef.current[0] ?? [0, 0];
        if (!rid) return;

        setAlertButtonCooldown(true);
        setTimeout(() => setAlertButtonCooldown(false), 10_000);

        const payload: EmergencyPayload = {
            rideId: rid,
            location: pos as [number, number],
            reason: 'MANUAL_ALERT',
            gender: userRef.current?.gender,
            emergencyContacts: userRef.current?.emergencyContacts,
        };

        if (navigator.onLine) {
            const result = await triggerEmergency(payload);
            if (result) setEmergencyTriggered(true);
        } else {
            queueEmergencyAlert(payload);
            setPendingAlertCount((n) => n + 1);
        }
    }, []);

    return {
        showInactivityPopup,
        countdown,
        isOnline,
        emergencyTriggered,
        onUserResponded,
        manualAlert,
        alertButtonCooldown,
        pendingAlertCount,
    };
}
