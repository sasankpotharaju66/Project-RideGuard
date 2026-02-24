import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  // ✅ SHOW LOADING UI HERE
  if (loading) {
    return (
      <div className="p-6 text-center text-lg">
        Loading...
      </div>
    );
  }

  // ✅ NOT LOGGED IN → REDIRECT
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ LOGGED IN → SHOW PAGE
  return children;
};

export default ProtectedRoute;