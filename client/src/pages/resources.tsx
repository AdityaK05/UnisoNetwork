import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, Download, FileText, Star, Clock, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/MainLayout';

// Mock data for resources
const RESOURCES = [
  {
    id: 1,
    title: "Organic Chemistry Final Study Guide",
    description: "Comprehensive study guide covering all topics from the semester. Includes practice problems with solutions.",
    subject: "Chemistry",
    course: "CHEM 3010",
    fileType: "PDF",
    fileSize: "2.4 MB",
    uploadDate: "2025-05-02T14:30:00",
    uploader: "chemwhiz",
    uploaderAvatar: "https://i.pravatar.cc/150?img=14",
    downloads: 342,
    rating: 4.8,
    ratingCount: 56,
    icon: "📝"
  },
  {
    id: 2,
    title: "Calculus II Formula Sheet",
    description: "One-page formula sheet with all the important formulas and theorems for Calculus II.",
    subject: "Mathematics",
    course: "MATH 2210",
    fileType: "PDF",
    fileSize: "512 KB",
    uploadDate: "2025-05-01T09:45:00",
    uploader: "mathguru",
    uploaderAvatar: "https://i.pravatar.cc/150?img=7",
    downloads: 518,
    rating: 4.9,
    ratingCount: 87,
    icon: "📊"
  },
  {
    id: 3,
    title: "Introduction to Psychology Lecture Notes",
    description: "Detailed notes from all lectures for the intro to psych course. Includes diagrams and key concepts.",
    subject: "Psychology",
    course: "PSYC 1010",
    fileType: "DOCX",
    fileSize: "3.1 MB",
    uploadDate: "2025-04-28T16:20:00",
    uploader: "psych_student",
    uploaderAvatar: "https://i.pravatar.cc/150?img=23",
    downloads: 215,
    rating: 4.5,
    ratingCount: 32,
    icon: "🧠"
  },
  {
    id: 4,
    title: "Data Structures & Algorithms Cheat Sheet",
    description: "Comprehensive reference for common data structures, algorithms, and their time/space complexities.",
    subject: "Computer Science",
    course: "CS 2510",
    fileType: "PDF",
    fileSize: "1.8 MB",
    uploadDate: "2025-04-25T11:15:00",
    uploader: "codehacker",
    uploaderAvatar: "https://i.pravatar.cc/150?img=33",
    downloads: 429,
    rating: 4.7,
    ratingCount: 64,
    icon: "💻"
  },
  {
    id: 5,
    title: "Microeconomics Exam Practice Questions",
    description: "Over 100 practice questions with detailed solutions covering all topics from the course.",
    subject: "Economics",
    course: "ECON 2010",
    fileType: "PDF",
    fileSize: "4.2 MB",
    uploadDate: "2025-04-22T13:30:00",
    uploader: "econ_major",
    uploaderAvatar: "https://i.pravatar.cc/150?img=19",
    downloads: 287,
    rating: 4.6,
    ratingCount: 41,
    icon: "📈"
  },
  {
    id: 6,
    title: "Spanish 2 Verb Conjugation Tables",
    description: "Comprehensive tables of regular and irregular verb conjugations for all tenses covered in Spanish 2.",
    subject: "Languages",
    course: "SPAN 1020",
    fileType: "PDF",
    fileSize: "1.5 MB",
    uploadDate: "2025-04-20T10:45:00",
    uploader: "language_lover",
    uploaderAvatar: "https://i.pravatar.cc/150?img=29",
    downloads: 198,
    rating: 4.8,
    ratingCount: 27,
    icon: "🗣️"
  },
  {
    id: 7,
    title: "Physics Lab Report Template",
    description: "Well-structured template for physics lab reports with example data analysis and error calculation.",
    subject: "Physics",
    course: "PHYS 2110",
    fileType: "DOCX",
    fileSize: "824 KB",
    uploadDate: "2025-04-18T15:20:00",
    uploader: "physics_phenom",
    uploaderAvatar: "https://i.pravatar.cc/150?img=11",
    downloads: 342,
    rating: 4.7,
    ratingCount: 38,
    icon: "⚛️"
  },
  {
    id: 8,
    title: "Literary Theory Quick Reference",
    description: "Concise explanations of major literary theories with examples of application in textual analysis.",
    subject: "English",
    course: "ENGL 3050",
    fileType: "PDF",
    fileSize: "1.2 MB",
    uploadDate: "2025-04-15T17:40:00",
    uploader: "bookworm",
    uploaderAvatar: "https://i.pravatar.cc/150?img=36",
    downloads: 156,
    rating: 4.5,
    ratingCount: 22,
    icon: "📚"
  }
];

// Subject categories
const SUBJECTS = ["All", "Chemistry", "Computer Science", "Economics", "English", "Languages", "Mathematics", "Physics", "Psychology"];

// Tabs
const TABS = ["All Resources", "Most Downloaded", "Highest Rated", "Recently Added"];

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeTab, setActiveTab] = useState('All Resources');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    document.title = "UNiSO - Resource Swaps";
  }, []);
  
  // Filter resources based on search and selected subject
  let filteredResources = RESOURCES.filter(resource => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.course.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Subject filter
    const matchesSubject = selectedSubject === 'All' || resource.subject === selectedSubject;
    
    return matchesSearch && matchesSubject;
  });
  
  // Sort based on active tab
  if (activeTab === 'Most Downloaded') {
    filteredResources = [...filteredResources].sort((a, b) => b.downloads - a.downloads);
  } else if (activeTab === 'Highest Rated') {
    filteredResources = [...filteredResources].sort((a, b) => b.rating - a.rating);
  } else if (activeTab === 'Recently Added') {
    filteredResources = [...filteredResources].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }

  // Format date relative to current time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

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
                📚 Notes, Papers, and the Good Stuff
              </h1>
            </div>
          </div>
          
          <p className="mt-3 text-xl text-white/80">
            Study resources shared by students who've been there, done that
          </p>
        </div>
      </div>
      
      {/* Upload and search bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-md p-4 -mt-6 relative z-20">
          <div className="flex flex-col md:flex-row gap-4">
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-lg flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Resource
            </Button>
            
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                type="text"
                placeholder="Search notes, guides, papers..."
                className="pl-10 border-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button 
              variant="outline" 
              className="md:w-auto flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-4">
                <div className="w-full sm:w-auto">
                  <p className="text-sm font-medium text-gray-700 mb-1">Subject</p>
                  <Select 
                    value={selectedSubject} 
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs and resource listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Tabs defaultValue="All Resources" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 shadow-sm mb-6 w-full justify-start overflow-x-auto">
            {TABS.map(tab => (
              <TabsTrigger 
                key={tab} 
                value={tab}
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {filteredResources.length > 0 ? (
              <div className="space-y-4">
                {filteredResources.map(resource => (
                  <div 
                    key={resource.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
                  >
                    <div className="flex items-start p-6">
                      <div className="flex-shrink-0 bg-gray-100 h-14 w-14 rounded-lg flex items-center justify-center text-2xl mr-4">
                        {resource.icon}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{resource.title}</h3>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="mr-2">
                                {resource.subject}
                              </Badge>
                              <Badge variant="outline" className="bg-primary/10 text-primary border-0">
                                {resource.course}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-2 sm:mt-0 text-sm text-gray-500">
                            <div className="flex items-center mr-4">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span>{resource.rating}</span>
                              <span className="text-gray-400 ml-1">({resource.ratingCount})</span>
                            </div>
                            <div className="flex items-center">
                              <Download className="h-4 w-4 text-primary mr-1" />
                              <span>{resource.downloads}</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-gray-600 line-clamp-2">
                          {resource.description}
                        </p>
                        
                        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                          <div className="flex items-center">
                            <img 
                              src={resource.uploaderAvatar} 
                              alt={resource.uploader} 
                              className="h-6 w-6 rounded-full mr-2 object-cover"
                            />
                            <span className="text-sm text-gray-600">@{resource.uploader}</span>
                            <span className="text-sm text-gray-400 mx-2">•</span>
                            <div className="flex items-center text-sm text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatRelativeTime(resource.uploadDate)}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                            <div className="flex items-center text-sm text-gray-500 mr-2">
                              <FileText className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{resource.fileType} • {resource.fileSize}</span>
                            </div>
                            <Button variant="default" size="sm" className="rounded-full">
                              <Download className="h-4 w-4 mr-2" />
                              Download
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
                <div className="text-4xl mb-4 animate-bounce">📚</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No resources found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Be the first to share study materials for this subject!
                </p>
                <Button 
                  variant="default" 
                  className="mt-6"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resource
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}