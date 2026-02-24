import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Smartphone,
  Shield,
  MapPin,
  DollarSign,
  Users,
  Zap,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Drive = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-display text-5xl md:text-6xl font-bold text-gradient mb-6">
                Drive with RideGuard
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                Be your own boss and earn on your own terms. Join 2M+ driver partners earning great income.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Flexible hours, reliable income, and full support from our team. Start earning today!
              </p>
              <Button size="lg" className="h-14 px-8 text-base" onClick={() => navigate("/register")}>
                Become a Driver Partner
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-hero-gradient rounded-3xl opacity-20" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-12 text-center">
                <div className="text-6xl font-bold text-gradient mb-4">₹200K</div>
                <p className="text-lg font-semibold mb-2">Average Monthly Earnings</p>
                <p className="text-muted-foreground">First 3 months' guaranteed bonus included</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Drive Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">Why Drive with RideGuard?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join a platform that values your time, respects your effort, and rewards your dedication.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: TrendingUp,
                title: "Earn More",
                description: "Competitive commission rates with bonuses & incentives. Transparent payment every week.",
              },
              {
                icon: Clock,
                title: "Flexible Hours",
                description: "Drive whenever you want. Set your own schedule and work as much or as little as you like.",
              },
              {
                icon: Smartphone,
                title: "Easy App",
                description: "Simple, user-friendly app with real-time earnings tracking and instant payouts.",
              },
              {
                icon: Shield,
                title: "Full Support",
                description: "24/7 customer support team ready to help with any issues or concerns.",
              },
              {
                icon: MapPin,
                title: "Ride Everywhere",
                description: "Available in 100+ cities across India. Expand your earnings across multiple cities.",
              },
              {
                icon: DollarSign,
                title: "Guaranteed Income",
                description: "New drivers get assured earnings for the first 3 months while building your profile.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative bg-card rounded-2xl p-8 border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <item.icon className="w-12 h-12 text-gradient mb-4" />
                  <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">Simple Requirements</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join our platform in minutes. Here's what you need to get started.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="font-display text-2xl font-bold mb-6">Documents Required</h3>
              {[
                "Valid Driving License (21+ years)",
                "Vehicle Registration Certificate",
                "Insurance Certificate",
                "PAN Card or Aadhaar",
                "Bank Account Details",
                "Smartphone with Internet Connection",
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-lg text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="font-display text-2xl font-bold mb-6">Process to Join</h3>
              {[
                { num: "1", text: "Download the RideGuard Driver App" },
                { num: "2", text: "Complete Sign-up with basic details" },
                { num: "3", text: "Upload required documents (takes 5 mins)" },
                { num: "4", text: "Verification by our team (within 24 hours)" },
                { num: "5", text: "Background check (keeping you safe)" },
                { num: "6", text: "Start driving and earning!" },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    {step.num}
                  </div>
                  <span className="text-lg text-muted-foreground pt-1">{step.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Earnings Stats */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { icon: Users, label: "Active Drivers", value: "2M+" },
              { icon: TrendingUp, label: "Avg. Monthly Income", value: "₹200K" },
              { icon: Zap, label: "Rides Completed", value: "500M+" },
              { icon: Smartphone, label: "Avg. Rating", value: "4.8★" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-12 h-12 text-gradient mx-auto mb-4" />
                <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                <p className="text-muted-foreground text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Safety & Support */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">We've Got Your Back</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Safety, support, and success - that's our commitment to every driver partner.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Driver Safety",
                description:
                  "Real-time ride tracking, SOS features, and insurance coverage for all drivers and their vehicles.",
              },
              {
                icon: Users,
                title: "Community",
                description:
                  "Connect with other drivers, share tips, attend training sessions, and grow together.",
              },
              {
                icon: Zap,
                title: "24/7 Support",
                description:
                  "Dedicated support team available round the clock to help with any issues or concerns.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-8 border border-border text-center hover:border-primary/50 transition-all hover:shadow-lg"
              >
                <item.icon className="w-16 h-16 text-gradient mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-hero-gradient p-12 md:p-20 text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-background/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-background/10 translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Ready to Start Driving?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of drivers earning great income with flexible hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="dark" 
                  size="lg" 
                  className="h-14 px-8"
                  onClick={() => navigate("/register")}
                >
                  Apply Now
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="h-14 px-8 text-primary-foreground hover:bg-background/10"
                  onClick={() => navigate("/about")}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Drive;
