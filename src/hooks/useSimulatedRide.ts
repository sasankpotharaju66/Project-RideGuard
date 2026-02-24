import { useEffect, useState, useRef } from "react";

// simple haversine distance
const toRad = (v: number) => (v * Math.PI) / 180;
const haversineKm = (a: [number, number], b: [number, number]) => {
  const R = 6371; // km
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
};

// generate N intermediate points between two coords
const interpolateRoute = (from: [number, number], to: [number, number], steps = 20) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lon = from[1] + (to[1] - from[1]) * t;
    pts.push([lat, lon]);
  }
  return pts;
};

export const useSimulatedRide = (opts?: { pickup?: [number, number]; drop?: [number, number] }) => {
  const defaultPickup: [number, number] = opts?.pickup ?? [12.9716, 77.5946];
  const defaultDrop: [number, number] = opts?.drop ?? [12.9885, 77.6135];

  const [routePoints, setRoutePoints] = useState<[number, number][]>(() => interpolateRoute(defaultPickup, defaultDrop, 30));

  const [captainPos, setCaptainPos] = useState<[number, number]>(routePoints[0]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [status, setStatus] = useState<"arriving" | "riding" | "completed">("arriving");
  const [eta, setEta] = useState(Math.max(1, Math.round(routePoints.length * 0.4)));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch real route from OSRM when pickup/drop change; fallback to interpolation
  useEffect(() => {
    let mounted = true;
    const pickup = opts?.pickup ?? defaultPickup;
    const drop = opts?.drop ?? defaultDrop;

    const tryFetch = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const j = await res.json();
        if (mounted && j?.routes?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] = j.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          if (coords.length > 1) {
            setRoutePoints(coords);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }
      // fallback to linear interpolation
      if (mounted) setRoutePoints(interpolateRoute(pickup, drop, 30));
    };

    tryFetch();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.pickup?.[0], opts?.pickup?.[1], opts?.drop?.[0], opts?.drop?.[1]]);

  // restart simulation when routePoints updates
  useEffect(() => {
    setCaptainPos(routePoints[0]);
    setRouteIndex(0);
    setStatus("arriving");
    setEta(Math.max(1, Math.round(routePoints.length * 0.4)));

    if (intervalRef.current) clearInterval(intervalRef.current as any);

    intervalRef.current = setInterval(() => {
      setRouteIndex((prev) => {
        const next = prev + 1;
        if (next >= routePoints.length) {
          if (intervalRef.current) clearInterval(intervalRef.current as any);
          setStatus("completed");
          setEta(0);
          return prev;
        }
        setCaptainPos(routePoints[next]);
        setEta(Math.max(0, Math.round((routePoints.length - next) * 0.4)));

        if (next >= 3 && status === "arriving") {
          setStatus("riding");
        }
        return next;
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePoints]);

  const PICKUP = routePoints[0];
  const DROP = routePoints[routePoints.length - 1];

  const distanceKm = haversineKm(PICKUP, DROP);
  const fare = Math.max(30, Math.round((20 + distanceKm * 10) * 1)); // base + per km

  return { captainPos, status, eta, pickup: PICKUP, drop: DROP, routePoints, routeIndex, distanceKm, fare };
};
