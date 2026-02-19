import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl bg-hero-gradient p-12 md:p-20 text-center overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-background/10 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-background/10 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Ready to Ride?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Download the Rapido app and get your first ride at a special discount. Available on Android and iOS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="dark" size="lg" className="h-14 px-8 text-base">
                <Download size={20} /> Download App
              </Button>
              <Button variant="ghost" size="lg" className="h-14 px-8 text-base text-primary-foreground hover:bg-background/10 hover:text-primary-foreground border border-primary-foreground/30">
                Learn More <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
