import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import Cta from "@/components/landing/Cta";
import AppPreview from "@/components/landing/AppPreview";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    document.title = "UNiSO - Your Campus. Your People. Your Space.";
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Cta />
        <AppPreview />
      </main>
      <Footer />
    </div>
  );
}
