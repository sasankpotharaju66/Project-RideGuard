import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User, Phone, Users, Zap, ShieldAlert, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.jpeg";
import { motion } from "framer-motion";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [userType, setUserType] = useState<"user" | "driver" | null>(null);
  const [gender, setGender] = useState<"male" | "female" | "other">("other");
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string }[]>([{ name: "", phone: "" }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    // Stricter email regex: must start with alphanumeric, avoids extensive special chars at the start
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email)) return false;

    // Additional strict checks
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const domain = parts[1];
    if (domain.indexOf('.') === -1) return false; // Must have a TLD
    if (domain.split('.')[1].length < 2) return false; // TLD at least 2 chars

    return true;
  };

  const validatePasswordQuality = (pass: string): string | null => {
    if (!pass) return "Password is required";
    if (pass.length < 8) return "Password must be at least 8 characters long";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pass)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pass)) return "Password must contain at least one number";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return "Password must contain at least one special character";
    return null; // Valid
  };

  const validatePhone = (phone: string): boolean => {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, "");
    // Check if it's 10-15 digits (supports international format with +, or local format starting with 0)
    // Allows: +1234567890, 09848941182, 1234567890, etc.
    return /^\+?[1-9]\d{9,14}$/.test(cleaned) || /^0\d{9,14}$/.test(cleaned) || /^\d{10,15}$/.test(cleaned);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Full name must be at least 2 characters";
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (10-15 digits)";
    }

    // Validate password
    const pwdError = validatePasswordQuality(formData.password);
    if (pwdError) {
      newErrors.password = pwdError;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Validate emergency contacts (at least one is now required)
    const validContacts = emergencyContacts.filter(c => c.name.trim() && c.phone.trim());
    if (validContacts.length === 0) {
      newErrors.emergencyContacts = "At least one emergency contact is required";
      if (!emergencyContacts[0].name.trim()) newErrors.emergencyContact_0_name = "Contact name is required";
      if (!emergencyContacts[0].phone.trim()) newErrors.emergencyContact_0_phone = "Contact phone is required";
    }

    emergencyContacts.forEach((contact, idx) => {
      if (contact.name.trim() || contact.phone.trim() || idx === 0) {
        if (!contact.name.trim()) {
          newErrors[`emergencyContact_${idx}_name`] = "Contact name is required";
        }
        if (!contact.phone.trim()) {
          newErrors[`emergencyContact_${idx}_phone`] = "Contact phone is required";
        } else if (!validatePhone(contact.phone)) {
          newErrors[`emergencyContact_${idx}_phone`] = "Please enter a valid phone number";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, "");

      // Prepare user data
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        userType: userType || "user",
        gender,
        emergencyContacts: emergencyContacts
          .filter((c) => c.name.trim() && c.phone.trim())
          .map((c) => ({
            name: c.name.trim(),
            phone: c.phone.replace(/[\s\-\(\)]/g, ""),
          })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), userData);

      toast.success("Account created successfully! Welcome to RideGuard!");

      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Failed to create account. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please use a different email or sign in.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please use a stronger password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please check and try again.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      } else {
        // Append raw error to identify why registration fails
        errorMessage += ` [Detail: ${error.message || error.code || String(error)}]`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Logo and Back Button */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
              <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
          </div>

          {/* Role Selection */}
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            <h1 className="font-display text-3xl font-bold mb-2 text-center">Create Account</h1>
            <p className="text-muted-foreground mb-8 text-center">Choose your account type</p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Rider Signup */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => setUserType("user")}
                className="relative group bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border-2 border-primary/30 hover:border-primary/60 transition-all text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-2">Rider Signup</h3>
                  <p className="text-muted-foreground text-sm">
                    Sign up to book rides and track orders
                  </p>
                </div>
              </motion.button>

              {/* Driver Signup */}
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => navigate("/404")}
                className="relative group bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-2xl p-8 border-2 border-orange-500/30 hover:border-orange-500/60 transition-all text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <Zap className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold mb-2">Driver Signup</h3>
                  <p className="text-muted-foreground text-sm">
                    Sign up as a driver partner to start earning
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
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

        {/* Registration Form */}
        <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
          <div className="mb-6 pb-4 border-b border-border">
            <h1 className="font-display text-3xl font-bold mb-2">
              {userType === "driver" ? "Driver Signup" : "Rider Signup"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {userType === "driver"
                ? "Join our driver partner network and start earning"
                : "Sign up to book rides and track orders"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`pl-10 ${errors.name ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number (e.g., 09848941182)"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              <p className="text-xs text-muted-foreground">Format: 10-15 digits (spaces, dashes, parentheses allowed)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">Min 8 chars, incl. uppercase, lowercase, number, & special char</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                  required
                />
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <div className="flex gap-3">
                {(["male", "female", "other"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${gender === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:border-primary/50"
                      }`}
                  >
                    {g === "female" ? "👩 " : g === "male" ? "👨 " : "🧑 "}{g}
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShieldAlert size={14} className="text-destructive" />
                Emergency Contacts (Required)
              </Label>
              {errors.emergencyContacts && (
                <p className="text-xs text-destructive mb-2">{errors.emergencyContacts}</p>
              )}
              {emergencyContacts.map((ec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Contact name"
                        value={ec.name}
                        onChange={(e) => {
                          const updated = [...emergencyContacts];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setEmergencyContacts(updated);
                          // Clear error when user types
                          const errorKey = `emergencyContact_${idx}_name`;
                          if (errors[errorKey]) {
                            setErrors({ ...errors, [errorKey]: "" });
                          }
                        }}
                        className={errors[`emergencyContact_${idx}_name`] ? "border-destructive" : ""}
                      />
                      {errors[`emergencyContact_${idx}_name`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`emergencyContact_${idx}_name`]}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Phone number"
                        type="tel"
                        value={ec.phone}
                        onChange={(e) => {
                          const updated = [...emergencyContacts];
                          updated[idx] = { ...updated[idx], phone: e.target.value };
                          setEmergencyContacts(updated);
                          // Clear error when user types
                          const errorKey = `emergencyContact_${idx}_phone`;
                          if (errors[errorKey]) {
                            setErrors({ ...errors, [errorKey]: "" });
                          }
                        }}
                        className={errors[`emergencyContact_${idx}_phone`] ? "border-destructive" : ""}
                      />
                      {errors[`emergencyContact_${idx}_phone`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`emergencyContact_${idx}_phone`]}</p>
                      )}
                    </div>
                    {emergencyContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx));
                          // Clear errors for removed contact
                          const newErrors = { ...errors };
                          delete newErrors[`emergencyContact_${idx}_name`];
                          delete newErrors[`emergencyContact_${idx}_phone`];
                          setErrors(newErrors);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors mt-1"
                        title="Remove contact"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {emergencyContacts.length < 5 && (
                <button
                  type="button"
                  onClick={() => setEmergencyContacts([...emergencyContacts, { name: "", phone: "" }])}
                  className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  <Plus size={12} /> Add another contact
                </button>
              )}
            </div>

            <div className="text-sm">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1 rounded" required />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link to="#" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="#" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button type="submit" variant="hero" className="w-full h-12 text-base" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
