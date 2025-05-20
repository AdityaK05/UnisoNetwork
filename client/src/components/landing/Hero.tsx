"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden bg-gradient-to-br from-[#A066F5] via-[#649DF5] to-[#35D6F5] text-white">
      {/* Decorative blobs */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-white/10 rounded-full filter blur-3xl mix-blend-soft-light pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-white/10 rounded-full filter blur-3xl mix-blend-soft-light pointer-events-none"></div>

      {/* Optional dotted background — remove this if you suspect it's causing issues */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(white/10_1px,transparent_1px)] [background-size:24px_24px] opacity-20 z-0 pointer-events-none"></div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left content */}
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full backdrop-blur-md bg-white/20 text-white border border-white/30 shadow-sm mb-6">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300 animate-pulse" />
              <span className="text-sm font-medium">Where college life happens</span>
            </div>

            <h1 className="text-5xl tracking-tight font-bold text-white sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl font-poppins">
              <span className="block mb-2">One Stop</span>
              <span className="block mb-2">All things College.</span>
            </h1>

            <p className="mt-6 text-xl text-white/80 sm:mt-5 sm:text-xl md:mt-5 md:text-2xl font-light">
              Join Communities, explore Opportunities, and Stay Connected with your Campus.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="py-7 px-8 text-lg font-medium rounded-full bg-white text-indigo-600 hover:bg-white/90 shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                Join UNiSO Now
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-5 relative animate-float">
            <div className="relative mx-auto w-full max-w-md transition-transform duration-500 hover:scale-[1.02]">
              <div className="rounded-3xl overflow-hidden shadow-xl rotate-0 hover:rotate-1 transition-all duration-300">
                <img
                  className="w-full object-cover"
                  src="/images/front.png"
                  alt="Students collaborating on campus"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/5 mix-blend-overlay pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
