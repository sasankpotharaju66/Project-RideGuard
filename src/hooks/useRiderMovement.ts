import { useState, useEffect, useRef, useCallback } from 'react';

export type RideState = 'IDLE' | 'DRIVER_ASSIGNED' | 'ARRIVING' | 'PICKED_UP' | 'DROPPING' | 'COMPLETED';

interface RiderMovementProps {
    routePoints: [number, number][];
    onStateChange?: (state: RideState) => void;
    speedMultiplier?: number;
}

export const useRiderMovement = ({ routePoints, onStateChange, speedMultiplier = 1 }: RiderMovementProps) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [bearing, setBearing] = useState(0);
    const [rideState, setRideState] = useState<RideState>('IDLE');
    const [currentIndex, setCurrentIndex] = useState(0);

    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const currentPointIndexRef = useRef(0);
    const latestRoutePoints = useRef(routePoints);
    const currentSpeedMultiplier = useRef(speedMultiplier);

    useEffect(() => {
        latestRoutePoints.current = routePoints;
        currentSpeedMultiplier.current = speedMultiplier;
    }, [routePoints, speedMultiplier]);

    const calculateBearing = (p1: [number, number], p2: [number, number]) => {
        if (window.google?.maps?.geometry?.spherical) {
            const from = new window.google.maps.LatLng(p1[0], p1[1]);
            const to = new window.google.maps.LatLng(p2[0], p2[1]);
            return window.google.maps.geometry.spherical.computeHeading(from, to);
        }
        // Fallback: simple Cartesian bearing
        const y = p2[1] - p1[1];
        const x = p2[0] - p1[0];
        return (Math.atan2(y, x) * 180) / Math.PI;
    };

    const animate = useCallback((timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        if (latestRoutePoints.current.length < 2) return;

        const currentIndex = currentPointIndexRef.current;
        if (currentIndex >= latestRoutePoints.current.length - 1) {
            setRideState('COMPLETED');
            onStateChange?.('COMPLETED');
            return;
        }

        const p1 = latestRoutePoints.current[currentIndex];
        const p2 = latestRoutePoints.current[currentIndex + 1];

        // Calculate duration based on distance to keep speed somewhat consistent
        // For simulation, let's just say each segment takes some time
        const segmentDuration = 2000 / currentSpeedMultiplier.current;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / segmentDuration, 1);

        const lat = p1[0] + (p2[0] - p1[0]) * progress;
        const lng = p1[1] + (p2[1] - p1[1]) * progress;

        setPosition([lat, lng]);
        setBearing(calculateBearing(p1, p2));

        if (progress >= 1) {
            currentPointIndexRef.current += 1;
            setCurrentIndex(currentPointIndexRef.current);
            startTimeRef.current = timestamp;

            // Update state based on progress (demo logic)
            if (currentPointIndexRef.current === 1) {
                setRideState('ARRIVING');
                onStateChange?.('ARRIVING');
            } else if (currentPointIndexRef.current === Math.floor(latestRoutePoints.current.length / 4)) {
                setRideState('PICKED_UP');
                onStateChange?.('PICKED_UP');
            } else if (currentPointIndexRef.current === Math.floor(latestRoutePoints.current.length * 0.75)) {
                setRideState('DROPPING');
                onStateChange?.('DROPPING');
            }
        }

        animationRef.current = requestAnimationFrame(animate);
    }, [onStateChange]);

    const startRide = useCallback(() => {
        if (routePoints.length < 2) return;
        currentPointIndexRef.current = 0;
        setCurrentIndex(0);
        startTimeRef.current = null;
        setRideState('DRIVER_ASSIGNED');
        onStateChange?.('DRIVER_ASSIGNED');
        animationRef.current = requestAnimationFrame(animate);
    }, [routePoints, animate, onStateChange]);

    const stopRide = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setRideState('IDLE');
        onStateChange?.('IDLE');
    }, [onStateChange]);

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return { position, bearing, rideState, startRide, stopRide, currentIndex };
};
