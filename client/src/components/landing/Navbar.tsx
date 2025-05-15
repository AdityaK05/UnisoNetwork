import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
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
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur-sm"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary font-poppins">UNiSO</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Testimonials
            </a>
            <a href="#contact" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Contact
            </a>
            <a href="#" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
              About
            </a>
            <Button variant="default" size="sm" className="ml-2">
              Sign In
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
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
          <div className="pt-2 pb-3 space-y-1 bg-white shadow-lg">
            <a 
              href="#features" 
              className="text-gray-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={handleLinkClick}
            >
              Features
            </a>
            <a 
              href="#testimonials" 
              className="text-gray-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={handleLinkClick}
            >
              Testimonials
            </a>
            <a 
              href="#contact" 
              className="text-gray-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={handleLinkClick}
            >
              Contact
            </a>
            <a 
              href="#" 
              className="text-gray-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={handleLinkClick}
            >
              About
            </a>
            <div className="px-3 py-2">
              <Button className="w-full" variant="default">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
