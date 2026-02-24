import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.jpeg";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { name: "Ride", path: "/" },
    { name: "Drive", path: "/drive" },
    { name: "About", path: "/about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div
          onClick={() => navigate(isAuthenticated && user ? "/dashboard" : "/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
          <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <button
              key={link.name}
              onClick={() => navigate(link.path)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <User size={16} className="mr-2" />
                {user.name.split(" ")[0]}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
              <Button variant="hero" size="sm" onClick={() => navigate("/register")}>Sign up</Button>
            </>
          )}
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
                <button
                  key={link.name}
                  onClick={() => { navigate(link.path); setIsOpen(false); }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  {link.name}
                </button>
              ))}
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>
                    <User size={16} className="mr-2" />
                    {user.name}
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { handleLogout(); setIsOpen(false); }}>
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => { navigate("/login"); setIsOpen(false); }}>Log in</Button>
                  <Button variant="hero" size="sm" className="flex-1" onClick={() => { navigate("/register"); setIsOpen(false); }}>Sign up</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
