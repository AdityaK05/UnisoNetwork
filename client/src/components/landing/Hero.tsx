import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Hash } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 overflow-hidden bg-gradient-hero text-white">
      {/* Decorative elements - blobs and circles */}
      <div className="absolute top-20 right-0 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 text-white border border-white/20">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-300" />
              <span className="text-sm font-medium">Where college life happens</span>
            </div>
            
            <h1 className="text-5xl tracking-tight font-bold text-white sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl font-poppins">
              <span className="block mb-2">Your Campus.</span>
              <span className="block mb-2">Your People.</span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-secondary to-accent">Your Space.</span>
            </h1>
            
            <p className="mt-6 text-xl text-white/80 sm:mt-5 sm:text-xl md:mt-5 md:text-2xl font-light">
              The student-only social hub where college life thrives. Connect, collaborate, and create your college experience.
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4 sm:justify-center lg:justify-start">
              <Button
                size="lg"
                className="py-7 px-8 text-lg font-medium rounded-full bg-white text-primary hover:bg-white/90 shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                Join UNiSO Now
              </Button>
              
              <div className="flex items-center space-x-6 mt-2 sm:mt-0">
                <div className="flex items-center">
                  <Heart className="h-6 w-6 text-accent mr-2" />
                  <span className="text-white/80">15k+ Students</span>
                </div>
                <div className="flex items-center">
                  <Hash className="h-6 w-6 text-secondary mr-2" />
                  <span className="text-white/80">50+ Campuses</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex items-center gap-3 sm:justify-center lg:justify-start">
              <div className="flex -space-x-2">
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="" />
              </div>
              <span className="text-sm text-white/80">Joined by students from top universities</span>
            </div>
          </div>
          
          <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-5 relative animate-float">
            {/* Hero Image with fun overlays */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-300">
                <img 
                  className="w-full object-cover" 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=800" 
                  alt="Students collaborating on campus" 
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 mix-blend-overlay"></div>
              </div>
              
              {/* Fun bubble element 1 */}
              <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl rotate-3 hover-lift">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center">
                    <span className="text-white text-xl">🎉</span>
                  </div>
                  <span className="font-medium text-gray-800">Campus party tonight!</span>
                </div>
              </div>
              
              {/* Fun bubble element 2 */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl -rotate-6 hover-lift">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-white text-xl">📚</span>
                  </div>
                  <span className="font-medium text-gray-800">Study group @ 5PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
