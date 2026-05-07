import { useState, useCallback, useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

interface Location {
    address: string;
    coords: [number, number];
}

export const useMapInteraction = (apiKey: string) => {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries,
    });

    const [pickup, setPickup] = useState<Location>({ address: '', coords: [0, 0] });
    const [drop, setDrop] = useState<Location>({ address: '', coords: [0, 0] });
    const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
    const [fare, setFare] = useState<number>(0);
    const [distance, setDistance] = useState<string>('');
    const [duration, setDuration] = useState<string>('');

    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

    useEffect(() => {
        if (isLoaded) {
            geocoderRef.current = new window.google.maps.Geocoder();
            directionsServiceRef.current = new window.google.maps.DirectionsService();
        }
    }, [isLoaded]);

    const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
        return new Promise((resolve) => {
            const fallback = async () => {
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
                    const data = await res.json();
                    if (data && data.locality) {
                        return resolve(`${data.locality}, ${data.principalSubdivision || data.countryName}`);
                    }
                } catch (e) {
                    console.warn("Fallback geocoder failed", e);
                }
                resolve(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            };

            if (!geocoderRef.current) {
                return fallback();
            }

            geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results?.[0]) {
                    resolve(results[0].formatted_address);
                } else {
                    fallback();
                }
            });
        });
    }, []);

    const calculateRoute = useCallback(() => {
        if (!directionsServiceRef.current || !pickup.coords[0] || !drop.coords[0]) return;

        directionsServiceRef.current.route(
            {
                origin: { lat: pickup.coords[0], lng: pickup.coords[1] },
                destination: { lat: drop.coords[0], lng: drop.coords[1] },
                travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === 'OK' && result) {
                    setRoute(result);
                    const leg = result.routes[0].legs[0];
                    setDistance(leg.distance?.text || '');
                    setDuration(leg.duration?.text || '');

                    // Fare logic: base 30 + 10 per km (approx)
                    const distKm = (leg.distance?.value || 0) / 1000;
                    setFare(Math.max(30, Math.round(20 + distKm * 10)));
                }
            }
        );
    }, [pickup.coords, drop.coords]);

    const updatePickup = useCallback(async (lat: number, lng: number, address?: string) => {
        const finalAddress = address || (await reverseGeocode(lat, lng));
        setPickup({ address: finalAddress, coords: [lat, lng] });
    }, [reverseGeocode]);

    const updateDrop = useCallback(async (lat: number, lng: number, address?: string) => {
        const finalAddress = address || (await reverseGeocode(lat, lng));
        setDrop({ address: finalAddress, coords: [lat, lng] });
    }, [reverseGeocode]);

    useEffect(() => {
        if (pickup.coords[0] !== 0 && drop.coords[0] !== 0) {
            calculateRoute();
        }
    }, [pickup.coords, drop.coords, calculateRoute]);

    return {
        isLoaded,
        pickup,
        drop,
        route,
        fare,
        distance,
        duration,
        updatePickup,
        updateDrop,
        calculateRoute,
    };
};
