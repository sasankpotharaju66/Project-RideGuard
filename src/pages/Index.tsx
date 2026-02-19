import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import RideOptions from "@/components/RideOptions";
import HowItWorks from "@/components/HowItWorks";
import SafetySection from "@/components/SafetySection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <RideOptions />
      <HowItWorks />
      <SafetySection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
