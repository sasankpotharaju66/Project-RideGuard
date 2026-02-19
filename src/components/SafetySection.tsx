import { motion } from "framer-motion";
import { Shield, Phone, Eye, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Captains",
    description: "Every captain goes through thorough background verification and training.",
  },
  {
    icon: Phone,
    title: "Emergency SOS",
    description: "One-tap SOS button to alert emergency contacts and local authorities.",
  },
  {
    icon: Eye,
    title: "Live Tracking",
    description: "Share your ride with family and friends for real-time tracking.",
  },
  {
    icon: AlertTriangle,
    title: "Insurance Cover",
    description: "Every ride is insured, ensuring you're protected throughout your journey.",
  },
];

const SafetySection = () => {
  return (
    <section id="safety" className="py-24 bg-dark-gradient text-secondary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-sm font-medium text-primary mb-4">
              Your Safety First
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ride with <span className="text-gradient">Confidence</span>
            </h2>
            <p className="text-secondary-foreground/70 text-lg mb-8 max-w-lg">
              We've built multiple layers of safety so you can focus on your journey while we take care of the rest.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={22} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-secondary-foreground/60">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-hero-gradient animate-pulse-glow flex items-center justify-center">
                <Shield size={80} className="text-primary-foreground" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SafetySection;
