import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MessageSquare, ThumbsUp, PenLine } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for forum threads
const FORUM_THREADS = [
  {
    id: 1,
    title: "How to actually make friends in college?",
    content: "I'm a freshman and finding it hard to connect with people. Anyone have tips that actually work and aren't just 'join clubs'?",
    author: "lonelyfreshman",
    authorAvatar: "https://i.pravatar.cc/150?img=32",
    date: "2025-05-01T14:30:00",
    category: "College Hacks",
    replies: 24,
    likes: 47,
    isHot: true,
    tags: ["Freshman", "Social"]
  },
  {
    id: 2,
    title: "Is anyone else always tired no matter how much they sleep?",
    content: "I sleep 8 hours but still feel exhausted in class. Anyone else dealing with this or have tips?",
    author: "sleepyscholar",
    authorAvatar: "https://i.pravatar.cc/150?img=5",
    date: "2025-05-03T09:15:00",
    category: "Mental Health",
    replies: 36,
    likes: 89,
    isHot: true,
    tags: ["Health", "Wellness"]
  },
  {
    id: 3,
    title: "CONFESSION: I've never actually read a whole textbook",
    content: "4 years of college and I've never read a textbook cover to cover. I just skim and look at summaries. Anyone else?",
    author: "textbookskipper",
    authorAvatar: "https://i.pravatar.cc/150?img=12",
    date: "2025-05-04T22:45:00",
    category: "Confessions",
    replies: 52,
    likes: 134,
    isHot: true,
    tags: ["Study Habits", "Confessions"]
  },
  {
    id: 4,
    title: "How to meal prep when you have a mini fridge and no kitchen?",
    content: "Living in the dorms with just a mini fridge and microwave. Need cheap, healthy meal ideas that don't require cooking.",
    author: "dormchef",
    authorAvatar: "https://i.pravatar.cc/150?img=23",
    date: "2025-05-05T16:20:00",
    category: "College Hacks",
    replies: 19,
    likes: 42,
    isHot: false,
    tags: ["Food", "Dorm Life"]
  },
  {
    id: 5,
    title: "CONFESSION: I pretend to be busy to avoid my roommate",
    content: "My roommate is nice but they talk so much. I pretend to have Zoom calls or homework just to get alone time. Am I terrible?",
    author: "needspace",
    authorAvatar: "https://i.pravatar.cc/150?img=17",
    date: "2025-05-06T11:30:00",
    category: "Confessions",
    replies: 41,
    likes: 98,
    isHot: true,
    tags: ["Roommates", "Dorm Life"]
  },
  {
    id: 6,
    title: "Does anyone actually use all these productivity apps?",
    content: "I've downloaded like 5 productivity apps but never stick with any of them. What actually works for you?",
    author: "procrastinatorpro",
    authorAvatar: "https://i.pravatar.cc/150?img=36",
    date: "2025-05-07T13:25:00",
    category: "College Hacks",
    replies: 28,
    likes: 56,
    isHot: false,
    tags: ["Productivity", "Technology"]
  },
  {
    id: 7,
    title: "I think I chose the wrong major but I'm a junior already",
    content: "I'm not enjoying my courses and not excited about the career path, but I've already done 3 years. Too late to switch?",
    author: "majorregrets",
    authorAvatar: "https://i.pravatar.cc/150?img=11",
    date: "2025-05-08T10:40:00",
    category: "Mental Health",
    replies: 45,
    likes: 82,
    isHot: true,
    tags: ["Academics", "Career"]
  },
  {
    id: 8,
    title: "Best places on campus to cry without anyone seeing you?",
    content: "This is only half a joke. Finals week is coming and I need some private breakdown spots.",
    author: "stressedstudent",
    authorAvatar: "https://i.pravatar.cc/150?img=26",
    date: "2025-05-09T19:15:00",
    category: "Mental Health",
    replies: 63,
    likes: 215,
    isHot: true,
    tags: ["Finals", "Stress"]
  }
];

// Categories for tabs
const CATEGORIES = ["All", "College Hacks", "Mental Health", "Confessions"];

export default function ForumsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Filter threads based on search and active category
  const filteredThreads = FORUM_THREADS.filter(thread => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = activeCategory === 'All' || thread.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Format date relative to current time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

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
                💬 Real Talk: Ask. Vent. Vibe.
              </h1>
            </div>
            
            <Button 
              className="mt-6 md:mt-0 bg-white text-primary hover:bg-white/90 rounded-full flex items-center gap-2 shadow-lg"
            >
              <PenLine className="h-4 w-4" />
              New Thread
            </Button>
          </div>
          
          <p className="mt-3 text-xl text-white/80">
            Unfiltered conversations about classes, college life, and everything in between
          </p>
        </div>
      </div>
      
      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-md p-4 -mt-6 relative z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              type="text"
              placeholder="Search threads..."
              className="pl-10 border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Tabs and thread listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs defaultValue="All" onValueChange={setActiveCategory}>
          <TabsList className="bg-white p-1 shadow-sm mb-6">
            {CATEGORIES.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {CATEGORIES.map(category => (
            <TabsContent key={category} value={category} className="mt-0">
              {filteredThreads.length > 0 ? (
                <div className="space-y-4">
                  {filteredThreads.map(thread => (
                    <div 
                      key={thread.id}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
                    >
                      <div className="p-6">
                        <div className="flex items-start">
                          <img 
                            src={thread.authorAvatar} 
                            alt={thread.author} 
                            className="h-10 w-10 rounded-full mr-4 object-cover"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">@{thread.author}</span>
                                <span className="ml-2 text-sm text-gray-500">{formatRelativeTime(thread.date)}</span>
                              </div>
                              
                              {thread.isHot && (
                                <Badge className="bg-red-500/10 text-red-500 border-0">
                                  🔥 HOT
                                </Badge>
                              )}
                            </div>
                            
                            <h3 className="mt-2 text-xl font-bold text-gray-900">
                              {thread.title}
                            </h3>
                            
                            <p className="mt-2 text-gray-600 line-clamp-2">
                              {thread.content}
                            </p>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              {thread.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="bg-gray-50">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <MessageSquare className="h-4 w-4 mr-1 text-primary" />
                                <span>{thread.replies} replies</span>
                              </div>
                              <div className="flex items-center">
                                <ThumbsUp className="h-4 w-4 mr-1 text-primary" />
                                <span>{thread.likes} likes</span>
                              </div>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10 -ml-2">
                                Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Empty state
                <div className="text-center py-16 bg-gray-50 rounded-2xl">
                  <div className="text-4xl mb-4 animate-bounce">💭</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No threads found</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Be the first to start a conversation about this topic!
                  </p>
                  <Button 
                    variant="default" 
                    className="mt-6"
                  >
                    <PenLine className="h-4 w-4 mr-2" />
                    Create Thread
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}