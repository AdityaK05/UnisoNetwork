import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import MainLayout from "@/components/layout/MainLayout";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/AuthContext";
import { useLocation } from "wouter";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "UNiSO - Your Campus. Your People. Your Space.";
  }, []);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation("/groups");
    }
  }, [user, loading, setLocation]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  // If user exists, don't render (redirect will happen above)
  if (user) {
    return null;
  }

  // Show landing page for unauthenticated users
  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <Hero />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
        <Features />
      </motion.div>
    </MainLayout>
  );
}
