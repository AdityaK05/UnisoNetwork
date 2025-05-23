"use client";

import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Zap,
  Users,
  Calendar,
  MessageSquare,
  Briefcase,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  const isHomePage = location === "/";

  const navLinks = [
    {
      name: "Community",
      path: "/groups",
      icon: <Users className="h-4 w-4 md:mr-1.5 text-black" />,
      mobileIcon: <Users className="h-5 w-5 mr-3 text-black" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-white/10",
    },
    {
      name: "Events",
      path: "/events",
      icon: <Calendar className="h-4 w-4 md:mr-1.5 text-black" />,
      mobileIcon: <Calendar className="h-5 w-5 mr-3 text-black" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-white/10",
    },
    {
      name: "Real Talks",
      path: "/forums",
      icon: <MessageSquare className="h-4 w-4 md:mr-1.5 text-black" />,
      mobileIcon: <MessageSquare className="h-5 w-5 mr-3 text-black" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-white/10",
    },
    {
      name: "Jobs",
      path: "/internships",
      icon: <Briefcase className="h-4 w-4 md:mr-1.5 text-black" />,
      mobileIcon: <Briefcase className="h-5 w-5 mr-3 text-black" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-white/10",
    },
    {
      name: "Resources",
      path: "/resources",
      icon: <BookOpen className="h-4 w-4 md:mr-1.5 text-black" />,
      mobileIcon: <BookOpen className="h-5 w-5 mr-3 text-black" />,
      activeColor: "text-primary",
      hoverBg: "hover:bg-white/10",
    },
  ];

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled || !isHomePage
          ? "bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/10"
          : "bg-transparent"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold font-poppins ${isHomePage
                  ? "text-black"
                  : "text-black"
                }`}
            >
              UNiSO
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors ${location === link.path
                    ? `${link.activeColor} bg-white/10`
                    : `text-black hover:${link.activeColor}`
                  } ${link.hoverBg}`}
              >
                {link.icon}
                <span className="hidden sm:inline ml-1">{link.name}</span>
              </Link>
            ))}
            <Button
              variant="default"
              size="sm"
              className="rounded-full bg-white text-primary font-semibold hover:bg-white/90 px-6 transition-all duration-300 shadow-md"
            >
              Join Now
            </Button>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-full text-white hover:text-primary hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-4 pb-6 bg-white/10 backdrop-blur-xl rounded-b-2xl shadow-lg border-t border-white/10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={handleLinkClick}
                className={`flex items-center px-5 py-3 rounded-lg mx-3 text-base font-medium transition-colors ${location === link.path ? link.activeColor : "text-black"
                  } ${link.hoverBg}`}
              >
                {link.mobileIcon}
                {link.name}
              </Link>
            ))}
            <div className="px-4 mt-4">
              <Button className="w-full rounded-full py-6 bg-white text-primary font-medium shadow-md hover:bg-white/90">
                Join UNiSO Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
