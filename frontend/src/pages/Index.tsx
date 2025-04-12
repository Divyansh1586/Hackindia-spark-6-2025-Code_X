
import { useAuth } from "@/contexts/AuthContext";
import { AuthForms } from "@/components/AuthForms";
import  Dashboard  from "@/pages/Dashboard";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [shouldShowDashboard, setShouldShowDashboard] = useState(false);

  // This useEffect ensures the dashboard renders after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated && user) {
      setShouldShowDashboard(true);
    } else {
      setShouldShowDashboard(false);
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-docai-primary" />
      </div>
    );
  }

  return shouldShowDashboard ? <Dashboard /> : <AuthForms />;
};

export default Index;
