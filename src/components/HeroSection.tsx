import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Navigation, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.jpeg";

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleInputFocus = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
    }
  };

  const handleBookRide = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    if (!pickup || !drop) {
      return;
    }
    navigate("/track");
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background with logo */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-secondary/80" />
      {/* center watermark removed — using the prominent logo on the right instead */}

      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-6">
              🏍️ India's Largest Bike Taxi Platform
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Get There <br />
              <span className="text-gradient">Faster.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Book bike taxis, autos & cabs at the lowest fares. Beat the traffic, save time, and ride safe with RideGuard.
            </p>

            {/* Booking Card */}
            <div className="bg-card rounded-2xl p-6 shadow-card max-w-md border border-border">
              <h3 className="font-display font-semibold text-lg mb-4">Book a Ride</h3>
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
                  <input
                    type="text"
                    placeholder="Pickup location"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    onFocus={handleInputFocus}
                    readOnly={!isAuthenticated}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-destructive" size={18} />
                  <input
                    type="text"
                    placeholder="Drop location"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    onFocus={handleInputFocus}
                    readOnly={!isAuthenticated}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button variant="hero" className="w-full h-12 text-base" size="lg" onClick={handleBookRide}>
                  Find a Ride <ArrowRight size={18} />
                </Button>
              </div>
            </div>

            {/* Authentication Dialog */}
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sign In Required</DialogTitle>
                  <DialogDescription>
                    Please sign in or create an account to book a ride with RideGuard.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAuthDialog(false);
                      navigate("/login");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="hero"
                    onClick={() => {
                      setShowAuthDialog(false);
                      navigate("/register");
                    }}
                    className="w-full sm:w-auto"
                  >
                    Create Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Stats */}
            <div className="flex gap-8 mt-8">
              {[
                { value: "200M+", label: "Rides Completed" },
                { value: "100+", label: "Cities" },
                { value: "25M+", label: "Happy Users" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-2xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right side - Logo */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <img src={logo} alt="RideGuard" className="w-80 h-80 object-contain drop-shadow-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
