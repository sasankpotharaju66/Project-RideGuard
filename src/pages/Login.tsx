import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Users, Zap } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"user" | "driver" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error("Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {/* Logo and Back Button */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
              <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft size={20} />
            </Button>
          </div>

          {/* Role Selection */}
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            <h1 className="font-display text-3xl font-bold mb-2 text-center">Welcome Back</h1>
            <p className="text-muted-foreground mb-8 text-center">Choose your login type</p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* User Login */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setUserType("user")}
                className="relative group bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border-2 border-primary/30 hover:border-primary/60 transition-all text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-2">Rider Login</h3>
                  <p className="text-muted-foreground text-sm">
                    Sign in as a rider to book rides and track deliveries
                  </p>
                </div>
              </motion.button>

              {/* Driver Login */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => navigate("/404")}
                className="relative group bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-2xl p-8 border-2 border-orange-500/30 hover:border-orange-500/60 transition-all text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <Zap className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-2">Driver Login</h3>
                  <p className="text-muted-foreground text-sm">
                    Sign in as a driver partner to start earning
                  </p>
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
            <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserType(null)}
            title="Go back"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
          <div className="mb-6 pb-4 border-b border-border">
            <h1 className="font-display text-3xl font-bold mb-2">
              {userType === "driver" ? "Driver Login" : "Rider Login"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {userType === "driver"
                ? "Sign in to manage your rides and earnings"
                : "Sign in to book rides and track deliveries"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="#" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="hero" className="w-full h-12 text-base" size="lg" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
