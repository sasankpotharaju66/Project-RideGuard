import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RideMapProps {
  captainPos: [number, number];
  pickup: [number, number];
  drop: [number, number];
  routePoints: [number, number][];
  routeIndex: number;
  selectable?: boolean;
  selectionMode?: "pickup" | "drop" | undefined;
  onLocationSelect?: (lat: number, lon: number, type?: "pickup" | "drop") => void;
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

const RideMap = ({ captainPos, pickup, drop, routePoints, routeIndex, selectable, selectionMode, onLocationSelect }: RideMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captainMarkerRef = useRef<L.Marker | null>(null);
  const completedLineRef = useRef<L.Polyline | null>(null);
  const remainingLineRef = useRef<L.Polyline | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropMarkerRef = useRef<L.Marker | null>(null);
  // Keep a ref so the map click handler always sees the latest selectionMode (avoids stale closure)
  const selectionModeRef = useRef<"pickup" | "drop" | undefined>(selectionMode);
  useEffect(() => { selectionModeRef.current = selectionMode; }, [selectionMode]);

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

    pickupMarkerRef.current = L.marker(pickup, { icon: pickupIcon, draggable: true }).addTo(map).bindPopup("Pickup Location");
    dropMarkerRef.current = L.marker(drop, { icon: dropIcon, draggable: true }).addTo(map).bindPopup("Drop Location");

    // when markers are dragged, notify parent of new coords
    pickupMarkerRef.current.on("dragend", function (e: any) {
      const latlng = e.target.getLatLng();
      if (onLocationSelect) onLocationSelect(latlng.lat, latlng.lng, "pickup");
    });

    dropMarkerRef.current.on("dragend", function (e: any) {
      const latlng = e.target.getLatLng();
      if (onLocationSelect) onLocationSelect(latlng.lat, latlng.lng, "drop");
    });

    captainMarkerRef.current = L.marker(captainPos, { icon: captainIcon })
      .addTo(map)
      .bindPopup("Captain is here");

    completedLineRef.current = L.polyline([], {
      color: "hsl(45, 97%, 54%)",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    // initially create an empty remaining line; we'll populate it when route data is available
    remainingLineRef.current = L.polyline([], {
      color: "hsl(220, 10%, 70%)",
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    mapRef.current = map;

    if (selectable && onLocationSelect) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        // use ref so we always get the latest selectionMode, not the stale closure value
        onLocationSelect(lat, lng, selectionModeRef.current);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // when pickup/drop change, try to fetch actual driving route from OSRM and draw it
  useEffect(() => {
    if (!mapRef.current) return;
    if (!pickup || !drop) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const j = await res.json();
        if (j?.routes?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] = j.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          remainingLineRef.current?.setLatLngs(coords);
          // fit map to route bounds
          const latlngs = coords.map((c) => L.latLng(c[0], c[1]));
          const bounds = L.latLngBounds(latlngs);
          mapRef.current!.fitBounds(bounds.pad(0.15));
          return;
        }
      } catch (e) {
        // ignore and fallback
      }

      // fallback: use provided routePoints prop
      remainingLineRef.current?.setLatLngs(routePoints);
    };

    fetchRoute();
  }, [pickup, drop, routePoints]);

  // Update captain position and route lines
  useEffect(() => {
    if (!mapRef.current) return;

    captainMarkerRef.current?.setLatLng(captainPos);
    mapRef.current.panTo(captainPos, { animate: true, duration: 0.5 });

    completedLineRef.current?.setLatLngs(routePoints.slice(0, routeIndex + 1));
    remainingLineRef.current?.setLatLngs(routePoints.slice(routeIndex));

    // update pickup/drop markers when their coords change
    if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng(pickup);
    if (dropMarkerRef.current) dropMarkerRef.current.setLatLng(drop);
  }, [captainPos, routeIndex, routePoints]);

  return <div ref={containerRef} className="w-full h-full rounded-2xl" />;
};

export default RideMap;
