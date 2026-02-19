import { motion } from "framer-motion";
import { MapPin, UserCheck, Navigation, Star } from "lucide-react";

const steps = [
  {
    icon: MapPin,
    title: "Set Location",
    description: "Enter your pickup and drop location to find nearby rides",
  },
  {
    icon: UserCheck,
    title: "Choose Ride",
    description: "Select from Bike, Auto or Cab based on your preference",
  },
  {
    icon: Navigation,
    title: "Track & Ride",
    description: "Track your captain in real-time and enjoy a safe ride",
  },
  {
    icon: Star,
    title: "Rate & Pay",
    description: "Pay easily via UPI, wallet or cash and rate your experience",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl font-bold mb-4"
          >
            How It <span className="text-gradient">Works</span>
          </motion.h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Getting a ride is as simple as 1-2-3-4. Here's how it works.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="text-center relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-6 shadow-brand relative z-10">
                <step.icon size={32} className="text-primary-foreground" />
              </div>
              <span className="text-xs font-bold text-muted-foreground mb-2 block">
                STEP {index + 1}
              </span>
              <h3 className="font-display text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
