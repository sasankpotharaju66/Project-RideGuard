import { ArrowLeft, Clock, MapPin, Navigation, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import logo from "@/assets/logo.jpeg";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface RideRecord {
    id: string;
    pickup: string;
    drop: string;
    fare: number;
    distance: string;
    date: string;
    status: 'Active' | 'Completed' | 'Cancelled';
}

const RideHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [history, setHistory] = useState<RideRecord[]>([]);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const fetchHistory = async () => {
            let fbHistory: RideRecord[] = [];
            try {
                if (user.uid) {
                    const q = query(collection(db, "users", user.uid, "rideHistory"));
                    const snapshot = await getDocs(q);
                    fbHistory = snapshot.docs.map(doc => doc.data() as RideRecord);
                    if (fbHistory.length > 0) {
                        fbHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        setHistory(fbHistory);
                        return; // Firebase succeeded
                    }
                }
            } catch (e) {
                console.warn("Firebase fetch failed", e);
            }

            // Fallback local storage
            const historyKey = `ride_history_${user?.uid || 'guest'}`;
            const historyStr = localStorage.getItem(historyKey);
            if (historyStr) {
                try {
                    const localHistory = JSON.parse(historyStr);
                    if (localHistory.length > fbHistory.length) {
                        setHistory(localHistory);
                    }
                } catch (e) {
                    console.error("Error parsing history", e);
                    if (fbHistory.length === 0) setHistory([]);
                }
            }
        };

        fetchHistory();
    }, [user, navigate]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return "bg-green-100 text-green-700 border-green-200";
            case 'Cancelled': return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-blue-100 text-blue-700 border-blue-200";
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
                <div className="container mx-auto flex items-center justify-between h-16 px-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
                            <ArrowLeft size={22} />
                        </Button>
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="RideGuard logo" className="h-8 w-8 rounded-md object-contain" />
                            <span className="font-display text-xl font-bold">Ride History</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                        Dashboard
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 pb-12 px-4 container mx-auto max-w-3xl flex-1">
                <h1 className="font-display text-3xl font-black mb-2 text-foreground">Your Rides</h1>
                <p className="text-muted-foreground mb-8">View your recent ride activity and details.</p>

                {history.length === 0 ? (
                    <div className="bg-card rounded-2xl p-12 text-center border border-border shadow-sm flex flex-col items-center">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">No rides found</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            You haven't taken any rides yet. Book a ride to see it appear in your history.
                        </p>
                        <Button variant="default" onClick={() => navigate("/dashboard")}>
                            Book a Ride
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map((ride, idx) => (
                            <div key={`${ride.id}-${idx}`} className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm font-medium text-foreground">
                                            {format(new Date(ride.date), "MMM d, yyyy • h:mm a")}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-1">ID: {ride.id}</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(ride.status)}`}>
                                        {ride.status}
                                    </div>
                                </div>

                                {/* Route */}
                                <div className="space-y-3 p-4 bg-muted/30 rounded-xl mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">Pickup</p>
                                            <p className="text-sm font-medium leading-tight">{ride.pickup}</p>
                                        </div>
                                    </div>
                                    <div className="border-l-2 border-dashed border-border ml-1 h-3" />
                                    <div className="flex items-start gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">Dropoff</p>
                                            <p className="text-sm font-medium leading-tight">{ride.drop}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer details */}
                                <div className="flex items-center justify-between text-sm pt-4 border-t border-border/50">
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Wallet size={16} />
                                            <span className="font-semibold text-foreground">₹{ride.fare}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Navigation size={16} />
                                            <span>{ride.distance}</span>
                                        </div>
                                    </div>
                                    {ride.status === 'Active' && (
                                        <Button variant="link" size="sm" onClick={() => navigate("/track", { state: { rideId: ride.id } })}>
                                            Track <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RideHistory;
