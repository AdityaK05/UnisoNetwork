import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import Cta from "@/components/landing/Cta";
import AppPreview from "@/components/landing/AppPreview";
import MainLayout from "@/components/layout/MainLayout";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    document.title = "UNiSO - Your Campus. Your People. Your Space.";
  }, []);

  return (
    <MainLayout>
      <Hero />
      <Features />
      <Testimonials />
      <Cta />
      <AppPreview />
    </MainLayout>
  );
}
