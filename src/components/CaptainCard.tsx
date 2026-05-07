import { Phone, MessageSquare, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CaptainCardProps {
  status: "arriving" | "riding" | "completed" | "cancelled";
  eta: number;
  pickupAddr?: string;
  dropAddr?: string;
  fare?: number;
  distanceKm?: number;
  onSampleClick?: () => void;
  onCancelClick?: () => void;
  hideControls?: boolean;
}


const CaptainCard = ({ status, eta, pickupAddr = "", dropAddr = "", fare, distanceKm, onSampleClick, onCancelClick, hideControls }: CaptainCardProps) => {
  const statusLabels = {
    arriving: "Rider is on the way",
    riding: "Ride in progress",
    completed: "Ride completed!",
    cancelled: "Ride Cancelled",
  };

  const statusColors = {
    arriving: "bg-primary/10 text-primary",
    riding: "bg-green-100 text-green-700",
    completed: "bg-green-500 text-secondary-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const [sampleLoading, setSampleLoading] = useState(false);

  const handleSampleClick = () => {
    if (sampleLoading) return;
    setSampleLoading(true);
    if (onSampleClick) onSampleClick();
    setTimeout(() => {
      setSampleLoading(false);
    }, 22000);
  };

  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 overflow-hidden">
      {/* Sample Button for testing */}
      {!hideControls && status !== "completed" && (
        <div className="p-2 border-b border-border bg-muted/30 flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSampleClick}
            disabled={sampleLoading}
          >
            {sampleLoading ? "Testing..." : "Sample"}
          </Button>
        </div>
      )}

      {/* Status Bar */}
      <div className={`px-4 md:px-5 py-2 md:py-3 ${statusColors[status]} text-sm font-semibold text-center`}>
        {statusLabels[status]}
        {status !== "completed" && (
          <span className="ml-2">• ETA {eta} min</span>
        )}
      </div>

      {/* Rider Info */}
      <div className="p-3 md:p-5">
        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-hero-gradient flex items-center justify-center text-xl md:text-2xl">
            👤
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-base md:text-lg">Captain</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star size={14} className="text-primary fill-primary" />
              <span>4.8</span>
              <span>•</span>
              <span>KA-01-AB-1234</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <Phone size={16} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <MessageSquare size={16} />
            </Button>
          </div>
        </div>

        {/* Ride Details */}
        <div className="bg-muted rounded-xl p-3 md:p-4 space-y-2 md:space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">PICKUP</p>
              <p className="text-sm font-medium">{pickupAddr || "Unknown pickup"}</p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-border ml-1.5 h-4" />
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">DROP</p>
              <p className="text-sm font-medium">{dropAddr || "Unknown drop"}</p>
            </div>
          </div>
        </div>

        {/* Fare */}
        <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Estimated Fare</p>
            <p className="font-display text-xl font-bold">{fare ? `₹${fare}` : "—"}</p>
            {typeof distanceKm === "number" && (
              <p className="text-xs text-muted-foreground">{distanceKm.toFixed(2)} km</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Shield size={14} className="text-primary" />
              Ride Insured
            </div>
            {!hideControls && status !== "completed" && status !== "cancelled" && (
              <Button variant="outline" size="sm" onClick={onCancelClick} className="text-destructive border-destructive hover:bg-destructive/10 h-8">
                Cancel Ride
              </Button>
            )}
          </div>
        </div>

        {/* Safety (Removed emergency button) */}

        {status === "completed" && (
          <Button variant="hero" className="w-full mt-4 rounded-xl">
            ⭐ Rate Your Ride
          </Button>
        )}
      </div>
    </div>
  );
};

export default CaptainCard;
