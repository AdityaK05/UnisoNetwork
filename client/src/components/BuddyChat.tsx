import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/AuthContext';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Download, 
  Sparkles,
  X,
  Menu
} from 'lucide-react';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: number;
  file_name: string;
  file_type: string;
  created_at: string;
}

interface Skill {
  id: number;
  skill: string;
  skill_category: string;
  proficiency_level?: string;
}

const BuddyChat: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showProjectIdeas, setShowProjectIdeas] = useState(false);
  const [projectIdeas, setProjectIdeas] = useState<string[]>([]);
  const [showCoverLetterModal, setShowCoverLetterModal] = useState(false);
  const [coverLetterJob, setCoverLetterJob] = useState({ title: '', company: '', description: '' });
  const [generatedLetter, setGeneratedLetter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchChats();
      fetchDocuments();
      fetchSkills();
    }
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/api/buddy/chats');
      setChats(data.data);
      if (data.data.length > 0 && !currentChat) {
        setCurrentChat(data.data[0]);
        fetchMessages(data.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const fetchMessages = async (chatId: number) => {
    try {
      const { data } = await api.get(`/api/buddy/chats/${chatId}/messages`);
      setMessages(data.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/api/buddy/documents');
      setDocuments(data.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const { data } = await api.get('/api/buddy/skills');
      setSkills(data.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const title = prompt('Chat title:') || `Chat ${new Date().toLocaleDateString()}`;
      const { data } = await api.post('/api/buddy/chats', { title });
      const newChat = data.data;
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      setMessages([]);
      toast.success('New chat created');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const deleteChat = async (chatId: number) => {
    if (!window.confirm('Delete this chat?')) return;
    
    try {
      await api.delete(`/api/buddy/chats/${chatId}`);
      const updated = chats.filter(c => c.id !== chatId);
      setChats(updated);
      if (currentChat?.id === chatId) {
        setCurrentChat(updated[0] || null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentChat) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue,
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const { data } = await api.post(`/api/buddy/chats/${currentChat.id}/messages`, {
        message: inputValue,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.data.message,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/api/buddy/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments([data.data, ...documents]);
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId: number) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      await api.delete(`/api/buddy/documents/${docId}`);
      setDocuments(documents.filter(d => d.id !== docId));
      toast.success('Document deleted');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getSkillSuggestions = async () => {
    try {
      setShowSkillSuggestions(true);
      const { data } = await api.post('/api/buddy/skill-suggestions', {
        careerGoal: 'Professional development',
      });
      setSkillSuggestions(data.data.suggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast.error('Failed to get suggestions');
    }
  };

  const getProjectIdeas = async () => {
    try {
      setShowProjectIdeas(true);
      const { data } = await api.post('/api/buddy/project-ideas', { numberOfIdeas: 5 });
      setProjectIdeas(data.data.ideas);
    } catch (error) {
      console.error('Error getting project ideas:', error);
      toast.error('Failed to get project ideas');
    }
  };

  const generateCoverLetter = async () => {
    if (!coverLetterJob.title || !coverLetterJob.company) {
      toast.error('Please fill in job title and company name');
      return;
    }

    try {
      const { data } = await api.post('/api/buddy/cover-letter', {
        jobTitle: coverLetterJob.title,
        companyName: coverLetterJob.company,
        jobDescription: coverLetterJob.description,
      });
      setGeneratedLetter(data.data.coverLetter);
      toast.success('Cover letter generated!');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast.error('Failed to generate cover letter');
    }
  };

  const downloadCoverLetter = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedLetter], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${coverLetterJob.company}-${coverLetterJob.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-400 to-blue-500">
        <div className="text-white text-center">
          <h1 className="text-3xl font-bold mb-4">BUDDY</h1>
          <p>Please log in to use BUDDY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={24} className="text-purple-400" />
            <h1 className="text-xl font-bold">BUDDY</h1>
          </div>
          <Button
            onClick={createNewChat}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          >
            <Plus size={16} /> New Chat
          </Button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-gray-400 uppercase font-semibold">Chats</p>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => {
                setCurrentChat(chat);
                fetchMessages(chat.id);
              }}
              className={`p-3 rounded-lg cursor-pointer transition ${
                currentChat?.id === chat.id
                  ? 'bg-purple-600'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <p className="text-sm truncate">{chat.title}</p>
              <p className="text-xs text-gray-400">
                {new Date(chat.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {/* Documents Section */}
        <div className="border-t border-gray-700 p-4 space-y-3">
          <p className="text-xs text-gray-400 uppercase font-semibold">Documents</p>
          <label className="block">
            <input
              type="file"
              onChange={handleDocumentUpload}
              disabled={uploading}
              accept=".pdf,.docx,.doc,.txt,.xlsx,.xls"
              className="hidden"
            />
            <div className="p-2 border border-gray-600 rounded hover:bg-gray-800 cursor-pointer text-center text-sm">
              {uploading ? 'Uploading...' : '📤 Upload Document'}
            </div>
          </label>

          {documents.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {documents.slice(0, 3).map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded text-xs"
                >
                  <span className="truncate flex-1">{doc.file_name}</span>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-400 hover:text-red-600 ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-semibold">
            {currentChat?.title || 'BUDDY Chat'}
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={getSkillSuggestions}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Sparkles size={16} /> Skills
            </Button>
            <Button
              onClick={getProjectIdeas}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <FileText size={16} /> Projects
            </Button>
            <Button
              onClick={() => setShowCoverLetterModal(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Download size={16} /> Cover Letter
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Sparkles size={48} className="mx-auto mb-4 text-purple-400" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to BUDDY!</h2>
                <p className="text-gray-600">
                  I'm your AI assistant. Ask me about career guidance, skills,
                  <br />
                  project ideas, or anything else!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md lg:max-w-2xl p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask BUDDY anything..."
              disabled={!currentChat || loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button
              type="submit"
              disabled={!currentChat || loading || !inputValue.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Send size={20} />
            </Button>
          </form>
        </div>
      </div>

      {/* Skill Suggestions Modal */}
      {showSkillSuggestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">🎯 Skill Suggestions</h3>
              <button
                onClick={() => setShowSkillSuggestions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {skillSuggestions.map((skill, idx) => (
                <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-gray-800">{skill}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowSkillSuggestions(false)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Project Ideas Modal */}
      {showProjectIdeas && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">🚀 Project Ideas</h3>
              <button
                onClick={() => setShowProjectIdeas(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {projectIdeas.map((idea, idx) => (
                <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-800 text-sm">{idea}</p>
                </div>
              ))}
            </div>
            <Button
              onClick={() => setShowProjectIdeas(false)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {showCoverLetterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800">📝 Generate Cover Letter</h3>
              <button
                onClick={() => {
                  setShowCoverLetterModal(false);
                  setGeneratedLetter('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {!generatedLetter ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={coverLetterJob.title}
                    onChange={(e) =>
                      setCoverLetterJob({ ...coverLetterJob, title: e.target.value })
                    }
                    placeholder="e.g., Senior React Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={coverLetterJob.company}
                    onChange={(e) =>
                      setCoverLetterJob({ ...coverLetterJob, company: e.target.value })
                    }
                    placeholder="e.g., Google"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description (Optional)
                  </label>
                  <textarea
                    value={coverLetterJob.description}
                    onChange={(e) =>
                      setCoverLetterJob({
                        ...coverLetterJob,
                        description: e.target.value,
                      })
                    }
                    placeholder="Paste the job description here for better personalization..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24"
                  />
                </div>
                <Button
                  onClick={generateCoverLetter}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Generate Cover Letter
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap max-h-64 overflow-y-auto text-sm">
                  {generatedLetter}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={downloadCoverLetter}
                    className="flex-1 bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download size={16} /> Download
                  </Button>
                  <Button
                    onClick={() => setGeneratedLetter('')}
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                  >
                    Generate Another
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuddyChat;
