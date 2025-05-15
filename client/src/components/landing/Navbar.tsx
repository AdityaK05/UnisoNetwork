import { useState, useEffect } from "react";
import { Menu, X, Zap, Users, Calendar, MessageSquare, Briefcase, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

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

  // Check if we're on the homepage or another page to determine navbar styling
  const isHomePage = location === '/';
  
  const navLinks = [
    {
      name: "Community",
      path: "/groups",
      icon: <Users className="h-4 w-4 md:mr-1.5" />,
      mobileIcon: <Users className="h-5 w-5 mr-3 text-primary" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-purple-50"
    },
    {
      name: "Events",
      path: "/events",
      icon: <Calendar className="h-4 w-4 md:mr-1.5" />,
      mobileIcon: <Calendar className="h-5 w-5 mr-3 text-secondary" />,
      activeColor: "text-secondary",
      hoverBg: "hover:bg-teal-50"
    },
    {
      name: "Real Talks",
      path: "/forums",
      icon: <MessageSquare className="h-4 w-4 md:mr-1.5" />,
      mobileIcon: <MessageSquare className="h-5 w-5 mr-3 text-accent" />,
      activeColor: "text-accent",
      hoverBg: "hover:bg-pink-50"
    },
    {
      name: "Jobs",
      path: "/internships",
      icon: <Briefcase className="h-4 w-4 md:mr-1.5" />,
      mobileIcon: <Briefcase className="h-5 w-5 mr-3 text-lime" />,
      activeColor: "text-lime",
      hoverBg: "hover:bg-lime-50"
    },
    {
      name: "Resources",
      path: "/resources",
      icon: <BookOpen className="h-4 w-4 md:mr-1.5" />,
      mobileIcon: <BookOpen className="h-5 w-5 mr-3 text-primary" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-purple-50"
    }
  ];

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled || !isHomePage 
        ? "bg-white/95 backdrop-blur-md shadow-lg" 
        : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Zap className={`h-8 w-8 ${isHomePage ? "text-primary" : "text-primary"} mr-2`} />
              <span className={`text-2xl font-bold font-poppins ${
                isHomePage 
                  ? "bg-clip-text text-transparent bg-gradient-card-1" 
                  : "text-primary"
              }`}>UNiSO</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4 lg:space-x-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path} 
                className={`flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  location === link.path 
                    ? `${link.activeColor} bg-opacity-10` 
                    : `text-gray-700 hover:${link.activeColor}`
                } ${link.hoverBg}`}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.name}</span>
              </Link>
            ))}
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
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path} 
                className={`flex items-center hover:bg-gray-50 block px-5 py-3 rounded-lg mx-3 text-base font-medium ${
                  location === link.path ? link.activeColor : "text-gray-700"
                } ${link.hoverBg}`}
                onClick={handleLinkClick}
              >
                {link.mobileIcon}
                {link.name}
              </Link>
            ))}
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
