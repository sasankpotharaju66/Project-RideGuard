import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RideMapProps {
  captainPos: [number, number];
  pickup: [number, number];
  drop: [number, number];
  routePoints: [number, number][];
  routeIndex: number;
}

const createIcon = (html: string, size: number) =>
  L.divIcon({
    className: "",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const captainIcon = createIcon(
  `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,hsl(45,97%,54%),hsl(38,100%,50%));border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:18px;">🏍️</div>`,
  40
);

const pickupIcon = createIcon(
  `<div style="width:28px;height:28px;border-radius:50%;background:hsl(142,76%,36%);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;">P</div>`,
  28
);

const dropIcon = createIcon(
  `<div style="width:28px;height:28px;border-radius:50%;background:hsl(0,84%,60%);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:12px;color:white;font-weight:bold;">D</div>`,
  28
);

const RideMap = ({ captainPos, pickup, drop, routePoints, routeIndex }: RideMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captainMarkerRef = useRef<L.Marker | null>(null);
  const completedLineRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: L.LatLngExpression = [
      (pickup[0] + drop[0]) / 2,
      (pickup[1] + drop[1]) / 2,
    ];

    const map = L.map(containerRef.current, {
      center,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    L.marker(pickup, { icon: pickupIcon }).addTo(map).bindPopup("Pickup Location");
    L.marker(drop, { icon: dropIcon }).addTo(map).bindPopup("Drop Location");

    captainMarkerRef.current = L.marker(captainPos, { icon: captainIcon })
      .addTo(map)
      .bindPopup("Captain is here");

    completedLineRef.current = L.polyline([], {
      color: "hsl(45, 97%, 54%)",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    remainingLineRef.current = L.polyline(routePoints, {
      color: "hsl(220, 10%, 70%)",
      weight: 4,
      opacity: 0.5,
      dashArray: "10, 10",
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update captain position and route lines
  useEffect(() => {
    if (!mapRef.current) return;

    captainMarkerRef.current?.setLatLng(captainPos);
    mapRef.current.panTo(captainPos, { animate: true, duration: 0.5 });

    completedLineRef.current?.setLatLngs(routePoints.slice(0, routeIndex + 1));
    remainingLineRef.current?.setLatLngs(routePoints.slice(routeIndex));
  }, [captainPos, routeIndex, routePoints]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" />;
};

export default RideMap;
