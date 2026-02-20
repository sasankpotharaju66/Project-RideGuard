import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpeg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const links = ["Ride", "Drive", "Safety", "About"];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2">
          <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
          <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button variant="hero" size="sm">Sign up</Button>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden glass border-b border-border/50"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {links.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link}
                </a>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" size="sm" className="flex-1">Log in</Button>
                <Button variant="hero" size="sm" className="flex-1">Sign up</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
