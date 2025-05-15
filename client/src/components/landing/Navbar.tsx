import { useState, useEffect } from "react";
import { Menu, X, Zap, Users, Calendar, MessageSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when a link is clicked
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Zap className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-card-1 font-poppins">UNiSO</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-8">
            <a 
              href="#features" 
              className="flex items-center text-gray-700 hover:text-primary px-3 py-2 rounded-full text-sm font-medium transition-colors hover:bg-purple-50"
            >
              <Users className="h-4 w-4 mr-1.5" />
              Community
            </a>
            <a 
              href="#events" 
              className="flex items-center text-gray-700 hover:text-secondary px-3 py-2 rounded-full text-sm font-medium transition-colors hover:bg-teal-50"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Events
            </a>
            <a 
              href="#testimonials" 
              className="flex items-center text-gray-700 hover:text-accent px-3 py-2 rounded-full text-sm font-medium transition-colors hover:bg-pink-50"
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Real Talk
            </a>
            <a 
              href="#jobs" 
              className="flex items-center text-gray-700 hover:text-lime px-3 py-2 rounded-full text-sm font-medium transition-colors hover:bg-lime-50"
            >
              <Briefcase className="h-4 w-4 mr-1.5" />
              Jobs
            </a>
            <Button 
              variant="default" 
              size="sm" 
              className="ml-2 rounded-full pulse-glow font-medium bg-primary hover:bg-primary/90 transition-all duration-300 px-6"
            >
              Join Now
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-full text-gray-700 hover:text-primary hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-all"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md rounded-b-2xl shadow-lg">
            <a 
              href="#features" 
              className="flex items-center text-gray-700 hover:bg-purple-50 block px-5 py-3 rounded-lg mx-3 text-base font-medium"
              onClick={handleLinkClick}
            >
              <Users className="h-5 w-5 mr-3 text-primary" />
              Community
            </a>
            <a 
              href="#events" 
              className="flex items-center text-gray-700 hover:bg-teal-50 block px-5 py-3 rounded-lg mx-3 text-base font-medium"
              onClick={handleLinkClick}
            >
              <Calendar className="h-5 w-5 mr-3 text-secondary" />
              Events
            </a>
            <a 
              href="#testimonials" 
              className="flex items-center text-gray-700 hover:bg-pink-50 block px-5 py-3 rounded-lg mx-3 text-base font-medium"
              onClick={handleLinkClick}
            >
              <MessageSquare className="h-5 w-5 mr-3 text-accent" />
              Real Talk
            </a>
            <a 
              href="#jobs" 
              className="flex items-center text-gray-700 hover:bg-lime-50 block px-5 py-3 rounded-lg mx-3 text-base font-medium"
              onClick={handleLinkClick}
            >
              <Briefcase className="h-5 w-5 mr-3 text-lime" />
              Jobs
            </a>
            <div className="px-4 py-4">
              <Button className="w-full rounded-full pulse-glow font-medium py-6" variant="default">
                Join UNiSO Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
