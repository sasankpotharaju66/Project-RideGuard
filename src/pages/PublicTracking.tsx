import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Shield, AlertTriangle } from "lucide-react";
import { getRide, WS_URL } from "@/lib/api";
import GoogleRideMap from "@/components/GoogleRideMap";
import CaptainCard from "@/components/CaptainCard";
import logo from "@/assets/logo.jpeg";
import { useRiderMovement } from "@/hooks/useRiderMovement";
import { motion, AnimatePresence } from "framer-motion";

const PublicTracking = () => {
  const { rideId } = useParams();
  const [serverRide, setServerRide] = useState<any>(null);
  const [googlePath, setGooglePath] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!rideId) return;
    let ws: WebSocket | null = null;
    let mounted = true;

    (async () => {
      try {
        const data = await getRide(rideId);
        if (!mounted) return;
        setServerRide(data.ride);
      } catch (e) {
        console.warn(e);
      }

      try {
        ws = new WebSocket(WS_URL);
        ws.addEventListener('open', () => {
          ws!.send(JSON.stringify({ type: 'subscribe', rideId }));
        });
        ws.addEventListener('message', (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === 'ride:update' && msg.ride && msg.ride.id === rideId) {
              setServerRide(msg.ride);
            }
          } catch (e) { }
        });
      } catch (e) {
        console.warn('WS error', e);
      }
    })();

    return () => {
      mounted = false;
      if (ws) ws.close();
    };
  }, [rideId]);

  const handleRouteLoad = useCallback((route: google.maps.DirectionsResult) => {
    if (route.routes[0]?.legs[0]?.steps) {
      const path = route.routes[0].legs[0].steps.flatMap(s => s.path).map(p => [p.lat(), p.lng()] as [number, number]);
      setGooglePath(path);
    }
  }, []);

  const { captainPos, pickupCoords, dropCoords, pickup, drop, rideStatus, routePoints, routeIndex } = serverRide || {};

  const currentPath = googlePath.length > 0 ? googlePath : (routePoints || []);

  const { position, bearing, rideState, startRide, currentIndex } = useRiderMovement({
    routePoints: currentPath,
    speedMultiplier: 2,
    isPaused: rideStatus === 'CANCELLED',
  });

  useEffect(() => {
    if (currentPath.length > 1 && rideState === 'IDLE' && serverRide) {
      startRide(serverRide.routeIndex || 0);
    }
  }, [currentPath, rideState, startRide, serverRide]);

  if (!serverRide) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-pulse">
          <img src={logo} alt="RideGuard" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h2 className="font-display text-xl font-bold">Locating Ride...</h2>
        </div>
      </div>
    );
  }

  // Estimate ETA based on remaining points
  const eta = Math.max(0, Math.round(((routePoints?.length || 0) - (routeIndex || 0)) * 0.4));

  const displayPosition = position || captainPos;
  const remainingPath = displayPosition ? [displayPosition, ...currentPath.slice(currentIndex + 1)] : currentPath;

  const displayStatus = rideStatus === 'CANCELLED' ? 'cancelled' : (rideStatus === 'COMPLETED' ? 'completed' : 'riding');

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Top Bar - Premium Glossy */}
      <div className="flex items-center justify-between px-6 py-4 glass border-b border-border/50 z-30">
        <div className="flex items-center gap-2">
          <img src={logo} alt="RideGuard logo" className="h-8 w-8 rounded-md object-contain" />
          <span className="font-display text-xl font-bold text-gradient hidden sm:inline-block">RideGuard</span>
        </div>
        <div className="text-center">
          <h1 className="font-display font-black text-xl tracking-tight">Live Tracking</h1>
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-green-500 font-bold">
            <Shield size={10} /> Secure Trip
          </div>
        </div>
        <div>
          {/* Empty div for flex spacing */}
        </div>
      </div>

      {/* Map View */}
      <div className="relative flex-1">
        <GoogleRideMap
          captainPos={displayPosition}
          bearing={bearing}
          pickup={pickupCoords}
          drop={dropCoords}
          onRouteLoad={handleRouteLoad}
          remainingPath={remainingPath}
        />

        {/* Floating Captain Card (No buttons) */}
        <div className="absolute top-24 left-6 w-full max-w-sm z-20 hidden md:block">
          <CaptainCard
            status={displayStatus}
            eta={eta}
            pickupAddr={pickup || "Pickup Location"}
            dropAddr={drop || "Destination"}
            hideControls={true}
          />
        </div>

        {/* Bottom Panel - Mobile only overlay */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20 md:hidden">
          <CaptainCard
            status={displayStatus}
            eta={eta}
            pickupAddr={pickup || "Pickup Location"}
            dropAddr={drop || "Destination"}
            hideControls={true}
          />
        </div>
      </div>

      {/* Emergency Alert Banner (if triggered) */}
      {rideStatus === 'EMERGENCY_TRIGGERED' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-destructive text-destructive-foreground px-5 py-2 rounded-full shadow-2xl text-xs font-black animate-bounce whitespace-nowrap">
          🚨 SOS TRIGGERED BY RIDER
        </div>
      )}

      {/* Cancelled Trip Popup */}
      <AnimatePresence>
        {rideStatus === 'CANCELLED' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-card text-card-foreground p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center border-2 border-border"
            >
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="font-display font-black text-2xl mb-3 text-destructive">Trip Cancelled</h3>
              <p className="text-muted-foreground text-base mb-2">
                This ride has been cancelled by the user.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Live tracking is no longer available for this trip.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicTracking;
