import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Rapido rider" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

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
              Book bike taxis, autos & cabs at the lowest fares. Beat the traffic, save time, and ride safe with Rapido.
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button variant="hero" className="w-full h-12 text-base" size="lg" onClick={() => navigate("/track")}>
                  Find a Ride <ArrowRight size={18} />
                </Button>
              </div>
            </div>

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

          {/* Right side is the background image */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
