import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Upload, Download, FileText, Star, Clock, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/MainLayout';
import { toast } from 'react-hot-toast';

interface Resource {
  id: string;
  title: string;
  description: string;
  subject: string;
  course: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  uploader: string;
  uploaderAvatar: string;
  downloads: number;
  rating: number;
  ratingCount: number;
  icon: string;
}

const SUBJECTS = ["All", "Chemistry", "Computer Science", "Economics", "English", "Languages", "Mathematics", "Physics", "Psychology"];
const TABS = ["All Resources", "Most Downloaded", "Highest Rated", "Recently Added"];

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [activeTab, setActiveTab] = useState('All Resources');
  const [showFilters, setShowFilters] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "UNiSO - Resource Swaps";
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resources');
      const data = await response.json();
      const formattedResources = data.map((doc: any) => ({
        id: doc.id || doc.$id,
        title: doc.title,
        description: doc.description,
        subject: doc.subject,
        course: doc.course,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadDate: doc.created_at || doc.uploadDate,
        uploader: doc.uploader || '',
        uploaderAvatar: doc.uploaderAvatar || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        downloads: doc.downloads || 0,
        rating: doc.rating || 0,
        ratingCount: doc.ratingCount || 0,
        icon: getResourceIcon(doc.subject)
      }));
      setResources(formattedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (subject: string) => {
    const icons: Record<string, string> = {
      Chemistry: "🧪",
      "Computer Science": "💻",
      Economics: "📈",
      English: "📚",
      Languages: "🗣️",
      Mathematics: "📊",
      Physics: "⚛️",
      Psychology: "🧠"
    };
    return icons[subject] || "📝";
  };

  const filteredResources = useMemo(() => {
    let result = resources.filter(resource => {
      const matchesSearch = searchQuery === '' ||
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.course.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject = selectedSubject === 'All' || resource.subject === selectedSubject;

      return matchesSearch && matchesSubject;
    });

    switch (activeTab) {
      case 'Most Downloaded':
        return [...result].sort((a, b) => b.downloads - a.downloads);
      case 'Highest Rated':
        return [...result].sort((a, b) => b.rating - a.rating);
      case 'Recently Added':
        return [...result].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      default:
        return result;
    }
  }, [resources, searchQuery, selectedSubject, activeTab]);

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDownload = async (resourceId: string) => {
    try {
      // In a real app, you would track downloads in your database
      toast.success('Download started!');
      // Simulate download tracking
      setTimeout(() => {
        toast.success('Resource downloaded successfully');
      }, 1500);
    } catch (error) {
      toast.error('Failed to download resource');
    }
  };

  const handleUpload = () => {
    toast.success('Upload form would open here');
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

      {/* Loading state */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resources...</p>
        </div>
      )}

      {/* Content when loaded */}
      {!loading && (
        <>
          {/* Upload and search bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl shadow-md p-4 -mt-6 relative z-20">
              <div className="flex flex-col md:flex-row gap-4">
                <Button
                  className="bg-primary text-white hover:bg-primary/90 rounded-lg flex items-center gap-2"
                  onClick={handleUpload}
                >
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
                                  <span>{resource.rating.toFixed(1)}</span>
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
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() => handleDownload(resource.id)}
                                >
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
                      onClick={handleUpload}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Resource
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </MainLayout>
  );
}