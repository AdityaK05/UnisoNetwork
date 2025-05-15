import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Plus, Heart } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for community groups
const COMMUNITY_GROUPS = [
  {
    id: 1,
    name: "Late Night Study Squad",
    tagline: "For night owls cramming before exams",
    interests: ["Study", "Academic"],
    memberCount: 87,
    emoji: "🦉",
    gradientClass: "bg-gradient-card-1"
  },
  {
    id: 2,
    name: "Creative Minds",
    tagline: "Artists, designers & creators unite",
    interests: ["Art", "Design", "Creative"],
    memberCount: 124,
    emoji: "🎨",
    gradientClass: "bg-gradient-card-2"
  },
  {
    id: 3,
    name: "Tech Innovators",
    tagline: "Coding, hacking & building cool stuff",
    interests: ["Tech", "Coding", "Innovation"],
    memberCount: 156,
    emoji: "💻",
    gradientClass: "bg-gradient-card-3"
  },
  {
    id: 4,
    name: "Future Entrepreneurs",
    tagline: "Business ideas & startup dreams",
    interests: ["Business", "Entrepreneurship"],
    memberCount: 93,
    emoji: "🚀",
    gradientClass: "bg-gradient-card-4"
  },
  {
    id: 5,
    name: "Film Fanatics",
    tagline: "Movie nights & cinematic convos",
    interests: ["Movies", "Entertainment"],
    memberCount: 112,
    emoji: "🎬",
    gradientClass: "bg-gradient-card-5"
  },
  {
    id: 6,
    name: "Fitness Fam",
    tagline: "Workout buddies & wellness tips",
    interests: ["Fitness", "Health"],
    memberCount: 135,
    emoji: "💪",
    gradientClass: "bg-gradient-card-1"
  },
  {
    id: 7,
    name: "Music Makers",
    tagline: "Musicians, producers & music lovers",
    interests: ["Music", "Creative"],
    memberCount: 167,
    emoji: "🎵",
    gradientClass: "bg-gradient-card-2"
  },
  {
    id: 8,
    name: "Plant Parents",
    tagline: "Green thumbs & plant enthusiasts",
    interests: ["Plants", "Nature"],
    memberCount: 78,
    emoji: "🌱",
    gradientClass: "bg-gradient-card-4"
  }
];

// Available interests for filtering
const INTERESTS = ["All", "Academic", "Art", "Business", "Coding", "Creative", "Design", "Entertainment", "Fitness", "Health", "Innovation", "Movies", "Music", "Nature", "Plants", "Study", "Tech"];

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const toggleInterest = (interest: string) => {
    if (interest === "All") {
      setSelectedInterests([]);
      return;
    }
    
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  // Filter groups based on search and selected interests
  const filteredGroups = COMMUNITY_GROUPS.filter(group => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Interest filter
    const matchesInterests = selectedInterests.length === 0 || 
      selectedInterests.some(interest => group.interests.includes(interest));
    
    return matchesSearch && matchesInterests;
  });

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header with gradient background */}
      <div className="bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl mix-blend-multiply"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
          {/* Back button removed as we now have the navbar */}
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-poppins">
                🫂 Your Vibe. Your Tribe.
              </h1>
            </div>
            
            <Button 
              className="mt-6 md:mt-0 bg-white text-primary hover:bg-white/90 rounded-full flex items-center gap-2 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Create New Group
            </Button>
          </div>
          
          <p className="mt-3 text-xl text-white/80">
            Find your people on campus and build your community
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
                placeholder="Search groups by name or description..."
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              onClick={() => setSelectedInterests([])}
              className={`cursor-pointer hover:bg-primary hover:text-white transition-colors ${selectedInterests.length === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              All
            </Badge>
            {INTERESTS.filter(i => i !== "All").map(interest => (
              <Badge
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`cursor-pointer hover:bg-primary hover:text-white transition-colors ${selectedInterests.includes(interest) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Group listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {filteredGroups.length} groups found
          </h2>
          
          <div className="flex gap-2">
            <Button variant="outline" className="text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              My Groups
            </Button>
          </div>
        </div>
        
        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
              <div 
                key={group.id}
                className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                {/* Group header with gradient */}
                <div className={`${group.gradientClass} h-24 p-6 flex justify-between items-start relative`}>
                  <div className="bg-white/20 backdrop-blur-sm h-12 w-12 rounded-full flex items-center justify-center text-2xl">
                    {group.emoji}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full h-9 w-9"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
                  <p className="text-gray-600">{group.tagline}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {group.interests.map(interest => (
                      <Badge key={interest} variant="outline" className="bg-gray-50">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span>{group.memberCount} members</span>
                    </div>
                    
                    <Button variant="default" className="rounded-full">
                      Join Group
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-16 bg-gray-50 rounded-2xl">
            <div className="text-4xl mb-4 animate-bounce">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No groups found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filters. Can't find what you're looking for? Create your own group!
            </p>
            <Button 
              variant="default" 
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setSelectedInterests([]);
              }}
            >
              Reset all filters
            </Button>
          </div>
        )}
      </div>
      </div>
    </MainLayout>
  );
}