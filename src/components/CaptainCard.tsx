import { Phone, MessageSquare, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptainCardProps {
  status: "arriving" | "riding" | "completed";
  eta: number;
}

const CaptainCard = ({ status, eta }: CaptainCardProps) => {
  const statusLabels = {
    arriving: "Captain is on the way",
    riding: "Ride in progress",
    completed: "Ride completed!",
  };

  const statusColors = {
    arriving: "bg-primary/10 text-primary",
    riding: "bg-green-100 text-green-700",
    completed: "bg-green-500 text-secondary-foreground",
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Status Bar */}
      <div className={`px-5 py-3 ${statusColors[status]} text-sm font-semibold text-center`}>
        {statusLabels[status]}
        {status !== "completed" && (
          <span className="ml-2">• ETA {eta} min</span>
        )}
      </div>

      {/* Captain Info */}
      <div className="p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-hero-gradient flex items-center justify-center text-2xl">
            🧑
          </div>
          <div className="flex-1">
            <h4 className="font-display font-bold text-lg">Rajesh Kumar</h4>
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
        <div className="bg-muted rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">PICKUP</p>
              <p className="text-sm font-medium">Koramangala 4th Block, Bangalore</p>
            </div>
          </div>
          <div className="border-l-2 border-dashed border-border ml-1.5 h-4" />
          <div className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">DROP</p>
              <p className="text-sm font-medium">Indiranagar 100 Feet Road, Bangalore</p>
            </div>
          </div>
        </div>

        {/* Fare */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Estimated Fare</p>
            <p className="font-display text-xl font-bold">₹45</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield size={14} className="text-primary" />
            Ride Insured
          </div>
        </div>

        {/* Safety */}
        {status !== "completed" && (
          <Button variant="destructive" className="w-full mt-4 rounded-xl">
            🚨 Emergency SOS
          </Button>
        )}

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
