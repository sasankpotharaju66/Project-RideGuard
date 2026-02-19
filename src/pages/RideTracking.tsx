import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSimulatedRide } from "@/hooks/useSimulatedRide";
import RideMap from "@/components/RideMap";
import CaptainCard from "@/components/CaptainCard";

const RideTracking = () => {
  const navigate = useNavigate();
  const { captainPos, status, eta, pickup, drop, routePoints, routeIndex } = useSimulatedRide();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display font-bold text-lg">Track Ride</h1>
        <Button variant="ghost" size="icon">
          <Share2 size={20} />
        </Button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <RideMap
          captainPos={captainPos}
          pickup={pickup}
          drop={drop}
          routePoints={routePoints}
          routeIndex={routeIndex}
        />

        {/* ETA Floating Badge */}
        {status !== "completed" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-hero-gradient px-5 py-2 rounded-full shadow-brand">
            <span className="font-display font-bold text-primary-foreground text-sm">
              🏍️ {eta} min away
            </span>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="relative z-20 -mt-6">
        <div className="mx-4 mb-4">
          <CaptainCard status={status} eta={eta} />
        </div>
      </div>
    </div>
  );
};

export default RideTracking;
