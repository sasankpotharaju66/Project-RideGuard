import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Users, Zap, Globe, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold text-gradient mb-6">
              About RideGuard
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              India's largest ride platform. Fast, affordable, and safe rides connecting millions of passengers with trusted drivers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted-foreground text-lg mb-6">
                We're on a mission to revolutionize urban mobility by providing safe, reliable, and affordable transportation to millions of people across India. Every ride is an opportunity to build trust and create meaningful connections.
              </p>
              <p className="text-muted-foreground text-lg mb-8">
                Through cutting-edge technology and our dedicated community of drivers, we're making transportation accessible to everyone, everywhere.
              </p>
              <Button onClick={() => navigate("/drive")} className="h-12 px-8">
                Join as a Driver
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-hero-gradient rounded-3xl opacity-20" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-12 text-center">
                <div className="text-6xl font-bold text-gradient mb-4">10M+</div>
                <p className="text-lg font-semibold mb-2">Happy Riders</p>
                <p className="text-muted-foreground">Trust RideGuard daily</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">Why Choose RideGuard?</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              We stand out from the competition with our commitment to quality, safety, and customer satisfaction.
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
                icon: Shield,
                title: "Safety First",
                description: "Advanced safety features including real-time tracking, emergency assistance, and verified drivers.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Quick pickups and efficient routes. Average wait time of just 3 minutes across India.",
              },
              {
                icon: TrendingUp,
                title: "Best Prices",
                description: "Transparent pricing with no hidden charges. Always competitive rates for every journey.",
              },
              {
                icon: Users,
                title: "Trusted Community",
                description: "2M+ verified drivers and millions of satisfied passengers building trust every day.",
              },
              {
                icon: Globe,
                title: "Everywhere in India",
                description: "Available in 100+ cities and towns across the country and expanding rapidly.",
              },
              {
                icon: Award,
                title: "Award Winner",
                description: "Recognized for excellence in service, innovation, and customer satisfaction.",
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

      {/* Stats Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-4 gap-8"
          >
            {[
              { label: "Active Users", value: "10M+" },
              { label: "Cities", value: "100+" },
              { label: "Daily Rides", value: "500K+" },
              { label: "Driver Partners", value: "2M+" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <p className="text-muted-foreground text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
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
                Ready to Experience RideGuard?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Get safe, affordable, and reliable rides in minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="dark" 
                  size="lg" 
                  className="h-14 px-8"
                  onClick={() => navigate("/register")}
                >
                  Get Started
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="h-14 px-8 text-primary-foreground hover:bg-background/10"
                  onClick={() => navigate("/")}
                >
                  Back to Home
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

export default About;
