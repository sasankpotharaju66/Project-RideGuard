/**
 * GoogleRideMap.tsx
 * ─────────────────
 * High-fidelity Google Maps-powered ride map.
 * Supports draggable markers, smooth rider animation tracking, and bearing-based rotation.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    DirectionsRenderer,
    Polyline,
    OverlayView,
} from '@react-google-maps/api';

const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 17.385, lng: 78.4867 }; // Hyderabad

interface GoogleRideMapProps {
    captainPos?: [number, number] | null;
    bearing?: number;
    pickup?: [number, number] | null;
    drop?: [number, number] | null;
    routePoints?: [number, number][];
    selectable?: boolean;
    draggableMarkers?: boolean;
    selectionMode?: 'pickup' | 'drop';
    onLocationSelect?: (lat: number, lon: number, type?: 'pickup' | 'drop') => void;
    onMarkerDragEnd?: (lat: number, lon: number, type: 'pickup' | 'drop') => void;
    rideRoute?: google.maps.DirectionsResult | null;
    onRouteLoad?: (route: google.maps.DirectionsResult) => void;
    remainingPath?: [number, number][];
    center?: [number, number] | null;
}

const toLatLng = (pt: [number, number] | null | undefined) =>
    pt ? { lat: pt[0], lng: pt[1] } : null;

const GoogleRideMap = ({
    captainPos,
    bearing = 0,
    pickup,
    drop,
    selectable,
    draggableMarkers,
    selectionMode,
    onLocationSelect,
    onMarkerDragEnd,
    rideRoute,
    onRouteLoad,
    remainingPath,
    center,
}: GoogleRideMapProps) => {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GMAP_KEY,
        libraries,
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

    const pickupStr = pickup ? `${pickup[0]},${pickup[1]}` : '';
    const dropStr = drop ? `${drop[0]},${drop[1]}` : '';

    useEffect(() => {
        if (rideRoute) {
            setDirections(rideRoute);
            onRouteLoad?.(rideRoute);
            return;
        }

        if (!isLoaded || !pickup || !drop || !window.google) return;

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: pickup[0], lng: pickup[1] },
                destination: { lat: drop[0], lng: drop[1] },
                travelMode: window.google.maps.TravelMode.WALKING,
            },
            (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                    onRouteLoad?.(result);
                }
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rideRoute, pickupStr, dropStr, isLoaded]);

    // Handle smooth panning when captain moves (throttled to avoid glitching)
    useEffect(() => {
        if (mapRef.current && captainPos && Array.isArray(captainPos) && !isNaN(captainPos[0]) && !isNaN(captainPos[1])) {
            const center = mapRef.current.getCenter();
            if (center) {
                const latDiff = Math.abs(center.lat() - captainPos[0]);
                const lngDiff = Math.abs(center.lng() - captainPos[1]);
                if (latDiff > 0.002 || lngDiff > 0.002) {
                    mapRef.current.panTo({ lat: captainPos[0], lng: captainPos[1] });
                }
            } else {
                mapRef.current.panTo({ lat: captainPos[0], lng: captainPos[1] });
            }
        }
    }, [captainPos]);

    // Handle explicit centering
    useEffect(() => {
        if (mapRef.current && center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
            mapRef.current.panTo({ lat: center[0], lng: center[1] });
        }
    }, [center]);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        map.setOptions({
            gestureHandling: 'greedy',
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            ]
        });
    }, []);

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (!selectable || !e.latLng || !onLocationSelect) return;
        onLocationSelect(e.latLng.lat(), e.latLng.lng(), selectionMode);
    }, [selectable, onLocationSelect, selectionMode]);

    const handleDragEnd = (e: google.maps.MapMouseEvent, type: 'pickup' | 'drop') => {
        if (onMarkerDragEnd && e.latLng) {
            onMarkerDragEnd(e.latLng.lat(), e.latLng.lng(), type);
        }
    };

    // Define a stable initial center (MUST BE BEFORE EARLY RETURNS)
    const [initialCenter] = useState(() => {
        const pLatLng = toLatLng(pickup);
        const cLatLng = toLatLng(captainPos);
        const dLatLng = toLatLng(drop);
        return cLatLng ?? pLatLng ?? dLatLng ?? defaultCenter;
    });

    if (loadError) return <div className="w-full h-full flex items-center justify-center text-destructive text-sm font-medium">Map failed to load</div>;
    if (!isLoaded) return <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm animate-pulse">Initializing Map…</div>;

    const pickupLatLng = toLatLng(pickup);
    const dropLatLng = toLatLng(drop);
    const captainLatLng = toLatLng(captainPos);

    const validRemainingPath = remainingPath
        ?.filter(p => Array.isArray(p) && p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1]))
        .map(p => ({ lat: p[0], lng: p[1] })) || [];

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={initialCenter}
            zoom={15}
            onLoad={onLoad}
            onClick={handleMapClick}
        >
            {/* Pickup Marker */}
            {pickupLatLng && (
                <Marker
                    position={pickupLatLng}
                    draggable={draggableMarkers}
                    onDragEnd={(e) => handleDragEnd(e, 'pickup')}
                    icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    title="Pickup Location"
                />
            )}

            {/* Drop Marker */}
            {dropLatLng && (
                <Marker
                    position={dropLatLng}
                    draggable={draggableMarkers}
                    onDragEnd={(e) => handleDragEnd(e, 'drop')}
                    icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    title="Drop Location"
                />
            )}

            {/* Rider / Captain Marker with Rotation */}
            {captainLatLng && (
                <Marker
                    position={captainLatLng}
                    icon={{
                        // North-facing Navigation Arrow (Sleek Uber-style)
                        path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z',
                        fillColor: '#F59E0B',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 1.5,
                        rotation: bearing,
                        anchor: new window.google.maps.Point(12, 12),
                    }}
                    title="Rider"
                />
            )}

            {/* Pulsing Radar Animation */}
            {captainLatLng && (
                <OverlayView
                    position={captainLatLng}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                    <div className="absolute -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/30 rounded-full animate-ping pointer-events-none" />
                </OverlayView>
            )}

            {/* Route Polyline (rendered via directions) */}
            {directions && (
                <DirectionsRenderer
                    directions={directions}
                    options={{
                        suppressMarkers: true,
                        preserveViewport: true,
                        polylineOptions: {
                            strokeColor: '#9CA3AF',
                            strokeWeight: 6,
                            strokeOpacity: 0.8,
                        },
                    }}
                />
            )}

            {/* Remaining Active Path */}
            {validRemainingPath.length > 0 && (
                <Polyline
                    path={validRemainingPath}
                    options={{
                        strokeColor: '#3B82F6',
                        strokeWeight: 6,
                        strokeOpacity: 1,
                        zIndex: 50,
                    }}
                />
            )}
        </GoogleMap>
    );
};

export default GoogleRideMap;

