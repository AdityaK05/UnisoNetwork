import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/AuthContext';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Plus, 
  Upload, 
  Sparkles,
  MessageCircle,
  Loader
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

const BuddyChatV2: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize
  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    try {
      const { data } = await api.get('/api/buddy/chats');
      setChats(data.data || []);
      
      if (data.data && data.data.length > 0 && !currentChat) {
        const chat = data.data[0];
        setCurrentChat(chat);
        await loadMessages(chat.id);
      }
    } catch (error: any) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const { data } = await api.get(`/api/buddy/chats/${chatId}/messages`);
      setMessages(data.data || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const createNewChat = async () => {
    try {
      const title = prompt('Chat title (optional):') || `Chat ${new Date().toLocaleDateString()}`;
      const { data } = await api.post('/api/buddy/chats', { title });
      
      const newChat = data.data;
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      setMessages([]);
      toast.success('New chat created');
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentChat || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const { data } = await api.post(`/api/buddy/chats/${currentChat.id}/messages`, {
        message: inputValue.trim(),
      });

      if (data.data?.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.message,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChat) return;

    // Check file type
    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, TXT, or DOC file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/api/buddy/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Document "${file.name}" uploaded successfully!`);
      
      // Add system message
      const systemMessage: Message = {
        role: 'assistant',
        content: `📄 Document "${file.name}" has been uploaded and indexed. I can now reference this document when answering your questions!`,
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const deleteChat = async (chatId: number) => {
    if (!window.confirm('Delete this chat? This action cannot be undone.')) return;

    try {
      await api.delete(`/api/buddy/chats/${chatId}`);
      const updated = chats.filter(c => c.id !== chatId);
      setChats(updated);
      
      if (currentChat?.id === chatId) {
        if (updated.length > 0) {
          setCurrentChat(updated[0]);
          loadMessages(updated[0].id);
        } else {
          setCurrentChat(null);
          setMessages([]);
        }
      }
      
      toast.success('Chat deleted');
    } catch (error: any) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  if (!currentChat && chats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h2 className="text-2xl font-bold mb-2">Start Chatting with BUDDY</h2>
          <p className="text-gray-600 mb-4">Create a new chat to begin your conversation with AI</p>
          <Button 
            onClick={createNewChat}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button 
            onClick={createNewChat}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 mb-3">CONVERSATIONS</h3>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => {
                setCurrentChat(chat);
                loadMessages(chat.id);
              }}
              className={`p-3 mb-2 rounded cursor-pointer transition ${
                currentChat?.id === chat.id
                  ? 'bg-purple-100 text-purple-900'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{chat.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <p className="text-gray-600">Start a conversation!</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg rounded-bl-none px-4 py-2">
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDocumentUpload}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx"
                disabled={uploading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={uploading || !currentChat}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </Button>
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask BUDDY anything..."
                disabled={loading || !currentChat}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600 disabled:opacity-50"
              />
              <Button
                type="submit"
                disabled={loading || !inputValue.trim() || !currentChat}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-xs text-gray-500">
              💡 Upload a resume or document to enable smarter, context-aware responses!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuddyChatV2;
