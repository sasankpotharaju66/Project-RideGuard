import { useEffect, useState, useRef } from "react";
import { LatLngExpression } from "leaflet";

// Simulated route points (Bangalore area)
const ROUTE_POINTS: [number, number][] = [
  [12.9716, 77.5946],
  [12.9720, 77.5960],
  [12.9728, 77.5975],
  [12.9735, 77.5990],
  [12.9740, 77.6005],
  [12.9750, 77.6015],
  [12.9760, 77.6025],
  [12.9770, 77.6032],
  [12.9780, 77.6040],
  [12.9790, 77.6048],
  [12.9800, 77.6055],
  [12.9812, 77.6062],
  [12.9825, 77.6070],
  [12.9835, 77.6080],
  [12.9845, 77.6090],
  [12.9855, 77.6098],
  [12.9862, 77.6108],
  [12.9870, 77.6115],
  [12.9878, 77.6125],
  [12.9885, 77.6135],
];

const PICKUP: [number, number] = ROUTE_POINTS[0];
const DROP: [number, number] = ROUTE_POINTS[ROUTE_POINTS.length - 1];

export const useSimulatedRide = () => {
  const [captainPos, setCaptainPos] = useState<[number, number]>(ROUTE_POINTS[0]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [status, setStatus] = useState<"arriving" | "riding" | "completed">("arriving");
  const [eta, setEta] = useState(8);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRouteIndex((prev) => {
        const next = prev + 1;
        if (next >= ROUTE_POINTS.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setStatus("completed");
          setEta(0);
          return prev;
        }
        setCaptainPos(ROUTE_POINTS[next]);
        setEta(Math.max(0, Math.round((ROUTE_POINTS.length - next) * 0.4)));

        if (next >= 3 && status === "arriving") {
          setStatus("riding");
        }
        return next;
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { captainPos, status, eta, pickup: PICKUP, drop: DROP, routePoints: ROUTE_POINTS, routeIndex };
};
