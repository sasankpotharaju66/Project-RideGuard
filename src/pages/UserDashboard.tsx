import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ArrowRight, User, Mail, Phone, LogOut, Menu, X, Clock, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.jpeg";
import { toast } from "sonner";
import GoogleRideMap from "@/components/GoogleRideMap";
import { createRide } from "@/lib/api";
import { useMapInteraction } from "@/hooks/useMapInteraction";
import { messaging, db } from "@/firebase";
import { getToken } from "firebase/messaging";
import { doc, updateDoc, setDoc } from "firebase/firestore";

const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const {
    isLoaded,
    pickup,
    drop,
    route,
    fare,
    distance,
    duration,
    updatePickup,
    updateDrop,
  } = useMapInteraction(GMAP_KEY);

  const [selectionMode, setSelectionMode] = useState<"pickup" | "drop" | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const bookingSectionRef = useRef<HTMLDivElement>(null);

  // Input element refs — native Autocomplete widgets attach to these
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);
  const pickupACRef = useRef<google.maps.places.Autocomplete | null>(null);
  const dropACRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Attach native Autocomplete widget to both inputs.
  useEffect(() => {
    if (!isLoaded || !pickupInputRef.current || !dropInputRef.current) return;

    // Pickup
    pickupACRef.current = new window.google.maps.places.Autocomplete(pickupInputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
    });
    pickupACRef.current.addListener('place_changed', () => {
      const place = pickupACRef.current!.getPlace();
      if (!place.geometry?.location) return;
      updatePickup(place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address);
    });

    // Drop
    dropACRef.current = new window.google.maps.places.Autocomplete(dropInputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
    });
    dropACRef.current.addListener('place_changed', () => {
      const place = dropACRef.current!.getPlace();
      if (!place.geometry?.location) return;
      updateDrop(place.geometry.location.lat(), place.geometry.location.lng(), place.formatted_address);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(pickupACRef.current!);
      window.google.maps.event.clearInstanceListeners(dropACRef.current!);
    };
  }, [isLoaded, updatePickup, updateDrop]);

  // Scroll to booking section if coming from Book Now button
  useEffect(() => {
    if (location.state?.scrollToBooking && bookingSectionRef.current) {
      setTimeout(() => {
        bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [location]);

  // Request FCM Notification Permissions & Save Token
  useEffect(() => {
    if (!user || !messaging) return;
    const requestPushPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BLYD_GkXj5Xg2RKVJgN5u4fUjK8A-j7N2x0L7f5C6C6C6C6C6C6C6C6C6C6C' // Replace with real VAPID key in production
          });
          if (token) {
            await updateDoc(doc(db, "users", user.uid), {
              fcmToken: token
            });
            console.log('FCM Token saved for user:', user.uid);
          }
        }
      } catch (err) {
        console.warn('Failed to get FCM token:', err);
      }
    };
    requestPushPermission();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleBookRide = async () => {
    if (!pickup.address || !drop.address) {
      toast.error("Please enter both pickup and drop locations");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pickup: pickup.address,
        drop: drop.address,
        pickupCoords: pickup.coords,
        dropCoords: drop.coords,
        userId: user?.uid,
        user: user
      };
      const json = await createRide(payload);
      const id = json?.ride?.id;
      if (!id) throw new Error('no id');

      // Save to local & Firebase history
      const rideData = {
        id,
        pickup: pickup.address,
        drop: drop.address,
        fare,
        distance,
        date: new Date().toISOString(),
        status: 'Active'
      };

      const historyKey = `ride_history_${user?.uid || 'guest'}`;
      const historyStr = localStorage.getItem(historyKey);
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.unshift(rideData);
      localStorage.setItem(historyKey, JSON.stringify(history));

      if (user?.uid) {
        try {
          await setDoc(doc(db, "users", user.uid, "rideHistory", id), rideData);
          console.log("Successfully saved ride to Firestore:", id);
        } catch (err: any) {
          console.error("Failed to save history to Firebase:", err);
          toast.error(`Firebase error: ${err.message || String(err)}`);
        }
      }

      toast.success("Ride booked! Connecting with rider...");
      setTimeout(() => {
        navigate('/track', {
          state: {
            rideId: id,
            pickup: pickup.address,
            drop: drop.address,
            pickupCoords: pickup.coords,
            dropCoords: drop.coords
          }
        });
      }, 1500);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  const handleMapSelect = async (lat: number, lon: number, type?: "pickup" | "drop") => {
    if (type === "pickup" || selectionMode === "pickup") {
      updatePickup(lat, lon);
    } else if (type === "drop" || selectionMode === "drop") {
      updateDrop(lat, lon);
    }
    setSelectionMode(null);
  };

  const handleMarkerDrag = (lat: number, lng: number, type: 'pickup' | 'drop') => {
    if (type === 'pickup') updatePickup(lat, lng);
    else updateDrop(lat, lng);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Reduced noise */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
            <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>Ride History</Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Logout
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Profile & Stats */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border"
              >
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/20">
                      <User size={40} className="text-primary" />
                    </div>
                    <div className="absolute bottom-4 right-0 w-6 h-6 bg-green-500 border-2 border-card rounded-full" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-1">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <div className="text-lg font-bold">{(user as any).totalRides || 0}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Rides</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-xl">
                    <div className="text-lg font-bold">
                      {((user as any).totalRides || 0) > 0 ? ((user as any).rating || "5.0") : "N/A"}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rating</div>
                  </div>
                </div>
              </motion.div>

              {/* Ride Summary Card (Visible when route is set) */}
              {fare > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg overflow-hidden relative"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <h3 className="font-display font-bold text-xl mb-4">Ride Summary</h3>
                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-80 text-sm">
                        <Navigation size={14} /> Distance
                      </div>
                      <div className="font-bold">{distance}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 opacity-80 text-sm">
                        <Clock size={14} /> Est. Time
                      </div>
                      <div className="font-bold">{duration}</div>
                    </div>
                    <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Wallet size={16} /> Est. Fare
                      </div>
                      <div className="text-2xl font-display font-black">₹{fare}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Content - Booking Section */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-3xl p-8 shadow-xl border border-border overflow-hidden"
              >
                <div className="mb-8">
                  <h1 className="font-display text-3xl font-bold mb-2">Where to?</h1>
                  <p className="text-muted-foreground">
                    Search location or drag markers on the map
                  </p>
                </div>

                <div className="grid gap-4 mb-6">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500 z-10" />
                    <input
                      ref={pickupInputRef}
                      type="text"
                      placeholder="Enter pickup location"
                      value={pickup.address}
                      onChange={(e) => updatePickup(pickup.coords[0], pickup.coords[1], e.target.value)}
                      className="w-full pl-10 pr-4 py-4 rounded-2xl bg-muted/50 border border-transparent focus:border-primary/30 transition-all font-medium"
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 z-10" />
                    <input
                      ref={dropInputRef}
                      type="text"
                      placeholder="Where are you going?"
                      value={drop.address}
                      onChange={(e) => updateDrop(drop.coords[0], drop.coords[1], e.target.value)}
                      className="w-full pl-10 pr-4 py-4 rounded-2xl bg-muted/50 border border-transparent focus:border-primary/30 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Map Section */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 h-[450px] mb-6">
                  <GoogleRideMap
                    pickup={pickup.coords[0] !== 0 ? pickup.coords : null}
                    drop={drop.coords[0] !== 0 ? drop.coords : null}
                    selectable={true}
                    draggableMarkers={true}
                    selectionMode={selectionMode ?? undefined}
                    onLocationSelect={handleMapSelect}
                    onMarkerDragEnd={handleMarkerDrag}
                    rideRoute={route}
                  />

                  {/* Floating Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                    <Button
                      variant={selectionMode === 'pickup' ? 'default' : 'secondary'}
                      className="flex-1 shadow-lg backdrop-blur-md"
                      onClick={() => setSelectionMode('pickup')}
                    >
                      Set Pickup
                    </Button>
                    <Button
                      variant={selectionMode === 'drop' ? 'destructive' : 'secondary'}
                      className="flex-1 shadow-lg backdrop-blur-md"
                      onClick={() => setSelectionMode('drop')}
                    >
                      Set Drop
                    </Button>
                  </div>
                </div>

                <Button
                  variant="hero"
                  className="w-full h-16 text-xl shadow-brand font-black rounded-2xl group"
                  onClick={handleBookRide}
                  disabled={loading || !pickup.address || !drop.address}
                >
                  {loading ? "Initializing..." : "Find a Ride"}
                  {!loading && <ArrowRight size={24} className="ml-2 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;

