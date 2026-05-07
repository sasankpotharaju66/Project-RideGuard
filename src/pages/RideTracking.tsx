import { ArrowLeft, Share2, Clock, MapPin, Bike, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useSimulatedRide } from "@/hooks/useSimulatedRide";
import { useSafetyMonitor } from "@/hooks/useSafetyMonitor";
import GoogleRideMap from "@/components/GoogleRideMap";
import CaptainCard from "@/components/CaptainCard";
import SafetyOverlay from "@/components/SafetyOverlay";
import { useEffect, useState, useMemo, useCallback } from "react";
import { getRide, WS_URL, cancelRide } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useRiderMovement, type RideState } from "@/hooks/useRiderMovement";
import { motion, AnimatePresence } from "framer-motion";

const calculateDistance = (path: [number, number][]) => {
  let dist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const [lat1, lon1] = path[i];
    const [lat2, lon2] = path[i + 1];
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    dist += R * c;
  }
  return dist;
};

const RideTracking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = (location.state || {}) as any;
  const pickupCoords = state?.pickupCoords as [number, number] | undefined;
  const dropCoords = state?.dropCoords as [number, number] | undefined;
  const rideId = state?.rideId as string | undefined;

  const [serverRide, setServerRide] = useState<any>(null);
  const [googlePath, setGooglePath] = useState<[number, number][]>([]);
  const [resolvedPickup, setResolvedPickup] = useState<string | null>(null);
  const [resolvedDrop, setResolvedDrop] = useState<string | null>(null);

  // Fallback to resolve coordinates if Google Maps Geocoding failed previously
  useEffect(() => {
    const resolveAddress = async (addrStr: string, setter: (val: string) => void) => {
      if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(addrStr)) {
        try {
          const [lat, lng] = addrStr.split(',').map(Number);
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
          const data = await res.json();
          if (data && data.locality) {
            setter(`${data.locality}, ${data.principalSubdivision || data.countryName}`);
          }
        } catch (e) { }
      }
    };

    if (state?.pickup) resolveAddress(state.pickup, setResolvedPickup);
    else if (serverRide?.pickup) resolveAddress(serverRide.pickup, setResolvedPickup);

    if (state?.drop) resolveAddress(state.drop, setResolvedDrop);
    else if (serverRide?.drop) resolveAddress(serverRide.drop, setResolvedDrop);
  }, [state?.pickup, state?.drop, serverRide?.pickup, serverRide?.drop]);

  // Fetch ride + subscribe to WebSocket updates
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
            if (msg.type === 'ride:update' && msg.ride && msg.ride.id === rideId) setServerRide(msg.ride);
            if (msg.type === 'emergency:alert' && msg.rideId === rideId) {
              toast.error(`🚨 Emergency: ${msg.emergency?.reason ?? 'triggered'}`, {
                duration: 8000,
                style: { background: '#dc2626', color: 'white' },
              });
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

  const simulated = useSimulatedRide({ pickup: pickupCoords, drop: dropCoords });

  const {
    eta,
    pickup,
    drop,
    routePoints,
    distanceKm,
    fare,
  } = serverRide
      ? {
        eta: Math.max(0, Math.round(((serverRide.routePoints?.length || 0) - (serverRide.routeIndex || 0)) * 0.4)),
        pickup: serverRide.pickupCoords || simulated.pickup,
        drop: serverRide.dropCoords || simulated.drop,
        routePoints: serverRide.routePoints || simulated.routePoints,
        distanceKm: simulated.distanceKm,
        fare: simulated.fare,
      }
      : simulated;

  const handleRouteLoad = useCallback((route: google.maps.DirectionsResult) => {
    if (route.routes[0]?.legs[0]?.steps) {
      const path = route.routes[0].legs[0].steps.flatMap(s => s.path).map(p => [p.lat(), p.lng()] as [number, number]);
      setGooglePath(path);
    }
  }, []);

  // ── Route Deviation Simulation ──────────
  const [isPaused, setIsPaused] = useState(false);
  const [isWrongWay, setIsWrongWay] = useState(false);
  const [showWrongWayPopup, setShowWrongWayPopup] = useState(false);

  // ── Smooth Rider Movement Hook ──────────
  const currentPath = googlePath.length > 0 ? googlePath : routePoints;
  const { position, bearing, rideState, startRide, currentIndex } = useRiderMovement({
    routePoints: currentPath,
    speedMultiplier: 2, // 2x speed for demo feel
    isPaused,
  });

  // ── Ride Cancellation ──────────
  const [isCancelled, setIsCancelled] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);

  const confirmCancel = useCallback(async () => {
    setIsCancelled(true);
    setShowCancelPopup(false);

    // Update local history
    if (rideId) {
      try {
        await cancelRide(rideId);
      } catch (e) {
        console.error("Failed to cancel ride on backend", e);
      }

      const historyKey = `ride_history_${user?.uid || 'guest'}`;
      const historyStr = localStorage.getItem(historyKey);
      if (historyStr) {
        let history = JSON.parse(historyStr);
        const idx = history.findIndex((r: any) => r.id === rideId);
        if (idx !== -1) {
          history[idx].status = 'Cancelled';
          localStorage.setItem(historyKey, JSON.stringify(history));
        }
      }
      if (user?.uid) {
        updateDoc(doc(db, "users", user.uid, "rideHistory", rideId), { status: 'Cancelled' }).catch(() => { });
      }
    }

    toast.error("Ride has been cancelled.");
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  }, [navigate, rideId, user]);

  const handleSampleAction = useCallback(() => {
    toast.info("Simulation started. Rider will deviate in 15 seconds...");
    setTimeout(() => {
      setIsWrongWay(true);
      setShowWrongWayPopup(true);
      setIsPaused(true);
    }, 15000);
  }, []);

  const handleCloseWrongWay = useCallback(() => {
    setIsPaused(false);
    setIsWrongWay(false);
    setShowWrongWayPopup(false);
  }, []);

  const displayPosition = isWrongWay && position ? [position[0] + 0.003, position[1] - 0.003] as [number, number] : position;

  const remainingPath = displayPosition ? [displayPosition, ...currentPath.slice(currentIndex + 1)] : currentPath;

  const dynamicEta = useMemo(() => {
    if (rideState === 'COMPLETED' || isCancelled) return 0;
    const dist = calculateDistance(remainingPath);
    // Estimate: ~24 km/h == 2.5 mins per km
    return Math.max(1, Math.ceil(dist * 2.5));
  }, [remainingPath, rideState, isCancelled]);

  // Start animation once we have route points
  useEffect(() => {
    // If we have a rideId, wait until we've fetched the serverRide to get its current progress
    if (rideId && !serverRide) return;

    if (routePoints.length > 1 && rideState === 'IDLE') {
      const initialIndex = serverRide?.routeIndex || 0;
      console.log(`[Tracking] Starting ride at index: ${initialIndex}`);
      startRide(initialIndex);
    }
  }, [routePoints, rideState, startRide, serverRide, rideId]);

  // Mark ride as completed in history
  useEffect(() => {
    if (rideState === 'COMPLETED' && rideId && !isCancelled) {
      // Update local storage
      const historyKey = `ride_history_${user?.uid || 'guest'}`;
      const historyStr = localStorage.getItem(historyKey);
      if (historyStr) {
        let history = JSON.parse(historyStr);
        const idx = history.findIndex((r: any) => r.id === rideId);
        if (idx !== -1 && history[idx].status !== 'Completed' && history[idx].status !== 'Cancelled') {
          history[idx].status = 'Completed';
          localStorage.setItem(historyKey, JSON.stringify(history));
        }
      }
      if (user?.uid) {
        updateDoc(doc(db, "users", user.uid, "rideHistory", rideId), { status: 'Completed' }).catch(() => { });
      }
    }
  }, [rideState, rideId, user]);

  // UI state map
  const stateDisplay = useMemo(() => {
    switch (rideState) {
      case 'DRIVER_ASSIGNED': return { text: 'Rider Assigned', color: 'bg-blue-500' };
      case 'ARRIVING': return { text: 'Rider is Moving', color: 'bg-yellow-500' };
      case 'PICKED_UP': return { text: 'En Route to Drop', color: 'bg-green-500' };
      case 'DROPPING': return { text: 'Arriving at Destination', color: 'bg-orange-500' };
      case 'COMPLETED': return { text: 'Ride Completed', color: 'bg-gray-800' };
      default: return { text: 'Finding Rider...', color: 'bg-primary' };
    }
  }, [rideState]);

  const {
    showInactivityPopup,
    countdown,
    isOnline,
    emergencyTriggered,
    onUserResponded,
    manualAlert,
    alertButtonCooldown,
    pendingAlertCount,
  } = useSafetyMonitor({
    rideId,
    user,
    routePoints,
    rideStatus: rideState === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
  });

  const handleShare = async () => {
    if (!rideId) {
      toast.error("Ride ID not found. Cannot share.");
      return;
    }
    const publicUrl = `${window.location.origin}/live/${rideId}`;
    const shareText = `Track my RideGuard journey from ${state?.pickup ?? "Current Location"} to ${state?.drop ?? "Destination"}.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Track my ride',
          text: shareText,
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${publicUrl}`);
        toast.success("Public tracking link copied to clipboard!");
      }
    } catch (e) {
      console.error("Error sharing:", e);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar - Premium Glossy */}
      <div className="flex items-center justify-between px-6 py-4 glass border-b border-border/50 z-30">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </Button>
        <div className="text-center">
          <h1 className="font-display font-black text-xl tracking-tight">Tracking Ride</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Secure Journey</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={handleShare}>
          <Share2 size={22} />
        </Button>
      </div>

      {/* Map View */}
      <div className="relative flex-1">
        <GoogleRideMap
          captainPos={displayPosition}
          bearing={bearing}
          pickup={pickup}
          drop={drop}
          onRouteLoad={handleRouteLoad}
          remainingPath={remainingPath}
        />



        {/* Emergency triggered indicator */}
        {emergencyTriggered && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-destructive text-destructive-foreground px-5 py-2 rounded-full shadow-2xl text-xs font-black animate-bounce">
            🚨 EMERGENCY ALERT BROADCASTED
          </div>
        )}

        {/* Wrong Way Popup */}
        <AnimatePresence>
          {showWrongWayPopup && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  backgroundColor: ["#dc2626", "#991b1b", "#dc2626"],
                }}
                transition={{
                  backgroundColor: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-sm text-destructive-foreground p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border-4 border-red-500/50"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-destructive mb-4 shadow-inner">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="font-display font-black text-xl mb-2">Route Deviation!</h3>
              <p className="text-red-100 font-medium text-sm mb-6">
                Please guide or correct the rider. They seem to be going the wrong way.
              </p>
              <Button
                variant="secondary"
                className="w-full font-bold h-12 rounded-xl text-lg shadow-lg hover:scale-105 transition-transform"
                onClick={handleCloseWrongWay}
              >
                OK
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Popup */}
        <AnimatePresence>
          {showCancelPopup && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-sm bg-card text-card-foreground p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border-2 border-border"
              >
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-display font-black text-xl mb-2">Cancel Ride?</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Are you sure you want to cancel this ride? You may be charged a cancellation fee.
              </p>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setShowCancelPopup(false)}>
                  No, Keep Ride
                </Button>
                <Button variant="destructive" className="flex-1" onClick={confirmCancel}>
                  Yes, Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-24 left-6 w-full max-w-sm z-20 hidden md:block">
          <CaptainCard
            status={isCancelled ? 'cancelled' : rideState === 'COMPLETED' ? 'completed' : 'riding'}
            eta={dynamicEta}
            pickupAddr={resolvedPickup || serverRide?.pickup || state?.pickup || "Current Location"}
            dropAddr={resolvedDrop || serverRide?.drop || state?.drop || "Destination"}
            fare={fare}
            distanceKm={distanceKm}
            onSampleClick={handleSampleAction}
            onCancelClick={() => setShowCancelPopup(true)}
          />
        </div>

        {/* Bottom Panel - Mobile only overlay */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[98%] max-w-md z-20 md:hidden">
          <CaptainCard
            status={isCancelled ? 'cancelled' : rideState === 'COMPLETED' ? 'completed' : 'riding'}
            eta={dynamicEta}
            pickupAddr={resolvedPickup || serverRide?.pickup || state?.pickup || "Current Location"}
            dropAddr={resolvedDrop || serverRide?.drop || state?.drop || "Destination"}
            fare={fare}
            distanceKm={distanceKm}
            onSampleClick={handleSampleAction}
            onCancelClick={() => setShowCancelPopup(true)}
          />
        </div>
      </div>

      {/* Safety Overlays */}
      <SafetyOverlay
        rideStatus={rideState === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS'}
        showInactivityPopup={showInactivityPopup}
        countdown={countdown}
        isOnline={isOnline}
        alertButtonCooldown={alertButtonCooldown}
        pendingAlertCount={pendingAlertCount}
        onUserResponded={onUserResponded}
        onManualAlert={manualAlert}
        emergencyContacts={user?.emergencyContacts}
      />
    </div>
  );
};

export default RideTracking;
