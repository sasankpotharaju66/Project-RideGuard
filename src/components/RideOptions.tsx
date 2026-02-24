import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Bike, Car, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const rides = [
  {
    icon: Bike,
    title: "Bike Taxi",
    description: "Fastest way to beat traffic. Affordable, quick and convenient.",
    price: "Starting ₹15",
    tag: "Most Popular",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Car,
    title: "Auto",
    description: "Comfortable 3-wheeler rides for short to medium distances.",
    price: "Starting ₹25",
    tag: "Comfortable",
    color: "bg-secondary/10 text-secondary",
  },
  {
    icon: Truck,
    title: "Cab",
    description: "Premium car rides for a comfortable journey across the city.",
    price: "Starting ₹49",
    tag: "Premium",
    color: "bg-primary/10 text-primary",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const RideOptions = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleBookNow = () => {
    if (isAuthenticated) {
      // Navigate to dashboard where user can enter pickup and drop locations
      navigate("/dashboard", { state: { scrollToBooking: true } });
    } else {
      // Show authentication popup
      setShowAuthDialog(true);
    }
  };

  return (
    <section id="ride" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-sm font-medium text-primary mb-4"
          >
            Choose Your Ride
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-4"
          >
            Multiple Ways to <span className="text-gradient">Move</span>
          </motion.h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether it's a quick commute or a long trip, we have the perfect ride for every occasion.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {rides.map((ride) => (
            <motion.div
              key={ride.title}
              variants={item}
              className="bg-card rounded-2xl p-8 shadow-card border border-border hover:shadow-brand transition-shadow duration-300 group"
            >
              <div className={`w-14 h-14 rounded-xl ${ride.color} flex items-center justify-center mb-6`}>
                <ride.icon size={28} />
              </div>
              <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {ride.tag}
              </span>
              <h3 className="font-display text-xl font-bold mt-4 mb-2">{ride.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{ride.description}</p>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-lg">{ride.price}</span>
                <Button variant="hero" size="sm" onClick={handleBookNow}>
                  Book Now
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
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
    </section>
  );
};

export default RideOptions;
