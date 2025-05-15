import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, MapPin, Users, CalendarDays, Sparkles, Search } from 'lucide-react';

// Mock data for campus events
const CAMPUS_EVENTS = [
  {
    id: 1,
    name: "Spring Fest Concert",
    description: "Annual live music festival with student and professional bands. Food, games, and good vibes!",
    date: "2025-05-20",
    time: "6:00 PM - 11:00 PM",
    location: "Main Quad",
    category: "Social",
    attendees: 328,
    emoji: "🎵",
    gradientClass: "bg-gradient-card-1",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-1.2.1&auto=format&fit=crop&w=1074&q=80"
  },
  {
    id: 2,
    name: "Tech Career Fair",
    description: "Connect with top tech companies hiring for internships and full-time positions. Bring your resume!",
    date: "2025-05-15",
    time: "10:00 AM - 3:00 PM",
    location: "Student Center",
    category: "Career",
    attendees: 215,
    emoji: "💼",
    gradientClass: "bg-gradient-card-2",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 3,
    name: "Midnight Breakfast",
    description: "Free breakfast served by professors during finals week. Come take a study break!",
    date: "2025-05-10",
    time: "11:00 PM - 1:00 AM",
    location: "Dining Hall",
    category: "Food",
    attendees: 472,
    emoji: "🍳",
    gradientClass: "bg-gradient-card-3",
    image: "https://images.unsplash.com/photo-1533089860892-a9b969de5140?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 4,
    name: "Sustainability Workshop",
    description: "Learn how to reduce your carbon footprint and live more sustainably on campus.",
    date: "2025-05-18",
    time: "2:00 PM - 4:00 PM",
    location: "Science Building, Room 101",
    category: "Workshop",
    attendees: 87,
    emoji: "🌱",
    gradientClass: "bg-gradient-card-4",
    image: "https://images.unsplash.com/photo-1464692805480-a69dfaafdb0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 5,
    name: "Movie Night: Blockbuster Premiere",
    description: "Free screening of the latest blockbuster movie with popcorn and drinks provided.",
    date: "2025-05-22",
    time: "8:00 PM - 10:30 PM",
    location: "Outdoor Amphitheater",
    category: "Entertainment",
    attendees: 196,
    emoji: "🎬",
    gradientClass: "bg-gradient-card-5",
    image: "https://images.unsplash.com/photo-1585647347384-2593bc35786b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80"
  },
  {
    id: 6,
    name: "Hackathon: Code for Good",
    description: "48-hour coding event to create solutions for local non-profits. All skill levels welcome!",
    date: "2025-05-25",
    time: "9:00 AM (48 hours)",
    location: "Engineering Building",
    category: "Tech",
    attendees: 142,
    emoji: "💻",
    gradientClass: "bg-gradient-card-1",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80"
  }
];

// Available categories for filtering
const CATEGORIES = ["All", "Social", "Career", "Food", "Workshop", "Entertainment", "Tech", "Sports", "Academic"];

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Filter events based on search, date and category
  const filteredEvents = CAMPUS_EVENTS.filter(event => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date filter
    const matchesDate = selectedDate === 'All' || (
      selectedDate === 'Today' ? new Date(event.date).toDateString() === new Date().toDateString() :
      selectedDate === 'This Week' ? isThisWeek(new Date(event.date)) :
      selectedDate === 'This Month' ? isThisMonth(new Date(event.date)) :
      true
    );
    
    // Category filter
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    
    return matchesSearch && matchesDate && matchesCategory;
  });

  // Helper functions for date filtering
  function isThisWeek(date: Date) {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay()));
    const end = new Date(now.setDate(now.getDate() + 6));
    return date >= start && date <= end;
  }
  
  function isThisMonth(date: Date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-poppins">
                🎉 What's Poppin' on Campus
              </h1>
            </div>
            
            <Badge className="mt-4 md:mt-0 bg-white/20 text-white border-0 py-1 px-3">
              <Sparkles className="h-3.5 w-3.5 mr-1 text-yellow-300" />
              <span>{CAMPUS_EVENTS.length} upcoming events</span>
            </Badge>
          </div>
          
          <p className="mt-3 text-xl text-white/80">
            Never miss the fun - parties, workshops, club meetups, and more
          </p>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-md p-4 -mt-6 relative z-20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                type="text"
                placeholder="Search events by name, description or location..."
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select 
                value={selectedDate} 
                onValueChange={setSelectedDate}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Dates</SelectItem>
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {filteredEvents.length} events found
          </h2>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              My Calendar
            </Button>
          </div>
        </div>
        
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map(event => (
              <div 
                key={event.id}
                className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="md:flex">
                  {/* Event image */}
                  <div className="md:w-2/5 relative h-40 md:h-auto">
                    <img 
                      src={event.image} 
                      alt={event.name} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white rounded-full p-2">
                      <span className="text-xl">{event.emoji}</span>
                    </div>
                    <Badge className="absolute top-4 right-4 bg-white/90 text-primary">
                      {event.category}
                    </Badge>
                  </div>
                  
                  {/* Event details */}
                  <div className="p-6 md:w-3/5">
                    <h3 className="text-xl font-bold text-gray-900">{event.name}</h3>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex">
                      <Button variant="default" className="rounded-full">
                        RSVP Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <div className="text-4xl mb-4 animate-bounce">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No events found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filters to find events on campus.
            </p>
            <Button 
              variant="default" 
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setSelectedDate('All');
                setSelectedCategory('All');
              }}
            >
              Reset all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}