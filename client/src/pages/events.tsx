import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, CalendarDays, Sparkles, Search } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for campus events
const CAMPUS_EVENTS = [
  {
    id: 1,
    title: "Welcome Week Mixer",
    description: "Meet new friends and kick off the semester right!",
    date: new Date("2025-01-15T18:00:00"),
    location: "Student Union Building",
    category: "Social",
    attendees: 205,
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
    featured: true
  },
  {
    id: 2,
    title: "Tech Career Fair",
    description: "Connect with top tech companies hiring interns and new grads",
    date: new Date("2025-01-25T10:00:00"),
    location: "Engineering Hall",
    category: "Career",
    attendees: 350,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
    featured: true
  },
  {
    id: 3,
    title: "Free Pizza Friday",
    description: "Come grab a slice and hang out!",
    date: new Date("2025-01-19T12:00:00"),
    location: "Campus Quad",
    category: "Food",
    attendees: 175,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80",
    featured: false
  },
  {
    id: 4,
    title: "Resume Workshop",
    description: "Get expert feedback on your resume from industry professionals",
    date: new Date("2025-02-05T15:00:00"),
    location: "Career Center",
    category: "Workshop",
    attendees: 89,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2071&q=80",
    featured: false
  },
  {
    id: 5,
    title: "Movie Night: Blockbuster Hits",
    description: "Outdoor screening of the latest blockbuster films",
    date: new Date("2025-01-22T19:30:00"),
    location: "University Amphitheater",
    category: "Entertainment",
    attendees: 270,
    image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
    featured: false
  },
  {
    id: 6,
    title: "Hackathon 2025",
    description: "24-hour coding competition with awesome prizes",
    date: new Date("2025-02-15T09:00:00"),
    location: "Tech Innovation Center",
    category: "Tech",
    attendees: 310,
    image: "https://images.unsplash.com/photo-1526378800651-c32d170fe6f8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2069&q=80",
    featured: true
  },
  {
    id: 7,
    title: "Intramural Sports Kickoff",
    description: "Sign up for spring intramural sports teams",
    date: new Date("2025-01-28T16:00:00"),
    location: "Recreation Center",
    category: "Sports",
    attendees: 145,
    image: "https://images.unsplash.com/photo-1472025378318-c87827ac6bb2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
    featured: false
  },
  {
    id: 8,
    title: "Study Group: Finals Prep",
    description: "Group study session for upcoming finals",
    date: new Date("2025-04-25T14:00:00"),
    location: "University Library",
    category: "Academic",
    attendees: 52,
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80",
    featured: false
  }
];

// Available categories for filtering
const CATEGORIES = ["All", "Social", "Career", "Food", "Workshop", "Entertainment", "Tech", "Sports", "Academic"];

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  useEffect(() => {
    document.title = "UNiSO - Campus Events";
  }, []);
  
  // Filter events based on search, date and category
  const filteredEvents = CAMPUS_EVENTS.filter(event => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    if (selectedDate === 'This Week') {
      matchesDate = isThisWeek(event.date);
    } else if (selectedDate === 'This Month') {
      matchesDate = isThisMonth(event.date);
    } else if (selectedDate === 'Future') {
      matchesDate = event.date > new Date();
    }
    
    // Category filter
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    
    return matchesSearch && matchesDate && matchesCategory;
  });
  
  // Helper function to check if a date is in the current week
  function isThisWeek(date: Date) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    return date >= weekStart && date <= weekEnd;
  }
  
  // Helper function to check if a date is in the current month
  function isThisMonth(date: Date) {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  return (
    <MainLayout>
      {/* Header with gradient background */}
      <div className="bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-poppins">
                📅 Campus Pulse
              </h1>
            </div>
            
            <Button 
              className="mt-6 md:mt-0 bg-white text-primary hover:bg-white/90 rounded-full flex items-center gap-2 shadow-lg"
            >
              <Calendar className="h-4 w-4" />
              Add to Calendar
            </Button>
          </div>
          
          <p className="mt-3 text-xl text-white/80">
            Never miss what's happening on campus
          </p>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-md p-4 -mt-6 relative z-20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                type="text"
                placeholder="Search events..."
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Dates</SelectItem>
                  <SelectItem value="This Week">This Week</SelectItem>
                  <SelectItem value="This Month">This Month</SelectItem>
                  <SelectItem value="Future">Future Events</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
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
      
      {/* Featured events */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredEvents.some(event => event.featured) && (
          <>
            <div className="flex items-center mb-6">
              <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-2xl font-bold text-gray-800">Featured Events</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredEvents
                .filter(event => event.featured)
                .map(event => (
                  <div 
                    key={event.id}
                    className="group rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 bg-white h-full flex flex-col"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={event.image} 
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-0 right-0 p-2">
                        <Badge className="bg-primary text-white">{event.category}</Badge>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 mb-4 flex-1">{event.description}</p>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center text-gray-500">
                          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                          <span>{event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <span>{event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span>{event.location}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <Users className="h-4 w-4 mr-2 text-primary" />
                          <span>{event.attendees} attending</span>
                        </div>
                      </div>
                      
                      <Button className="mt-6 w-full">RSVP Now</Button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        
        {/* All events */}
        <div className="flex items-center mb-6">
          <CalendarDays className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">All Events</h2>
        </div>
        
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents
              .filter(event => !event.featured || (filteredEvents.filter(e => e.featured).length === 0))
              .map(event => (
                <div 
                  key={event.id}
                  className="group rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100 bg-white h-full flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-0 right-0 p-2">
                      <Badge className="bg-primary text-white">{event.category}</Badge>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4 flex-1">{event.description}</p>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center text-gray-500">
                        <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                    
                    <Button variant="outline" className="mt-6 w-full">RSVP Now</Button>
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
              Try adjusting your search or filters. Check back later for new events!
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
    </MainLayout>
  );
}