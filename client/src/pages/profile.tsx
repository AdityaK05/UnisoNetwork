import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { Link } from 'wouter';
import api from '@/services/api';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { Edit2, Save, X, Plus, Trash2, Download, Star, GitBranch, ExternalLink, Upload, CheckCircle } from 'lucide-react';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  education?: string[];
  experience?: string[];
  projects?: string[];
  github_username?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  avatar_url?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  url: string;
  stars: number;
  language: string | null;
}

const Profile: React.FC = () => {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({});
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumePreview, setResumePreview] = useState<any>(null);
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [uploadedResumeFile, setUploadedResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (formData.github_username && !isEditing) {
      fetchGitHubRepos(formData.github_username);
    }
  }, [formData.github_username, isEditing]);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/users/profile');
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If no profile yet, use current user data
      if (user) {
        setProfile({
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        });
        setFormData({
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url,
        });
      }
    }
  };

  const fetchGitHubRepos = async (username: string) => {
    if (!username) return;
    setLoadingRepos(true);
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=6`);
      if (response.ok) {
        const repos: any[] = await response.json();
        setGithubRepos(
          repos
            .filter((r: any) => !r.fork) // Filter out forks
            .map((r: any) => ({
              id: r.id,
              name: r.name,
              description: r.description,
              url: r.html_url,
              stars: r.stargazers_count,
              language: r.language,
            }))
        );
      }
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadedResumeFile(file);
    setResumeFileName(file.name);
    
    const formDataObj = new FormData();
    formDataObj.append('resume', file);

    try {
      // Don't manually set Content-Type header - let axios handle it
      const { data } = await api.post('/api/resume/upload', formDataObj);

      if (data.data) {
        setResumePreview(data.data);
        
        // Auto-fill form data immediately with parsed resume
        setFormData(prev => {
          const merged = { ...prev };
          
          // Merge each field
          if (data.data.name && !prev.name) merged.name = data.data.name;
          if (data.data.email && !prev.email) merged.email = data.data.email;
          if (data.data.phone && !prev.phone) merged.phone = data.data.phone;
          if (data.data.summary && !prev.summary) merged.summary = data.data.summary;

          // For arrays, append without duplicates
          if (data.data.skills?.length) {
            merged.skills = Array.from(new Set([...(prev.skills || []), ...data.data.skills]));
          }
          if (data.data.experience?.length) {
            merged.experience = [...(prev.experience || []), ...data.data.experience];
          }
          if (data.data.education?.length) {
            merged.education = [...(prev.education || []), ...data.data.education];
          }
          if (data.data.projects?.length) {
            merged.projects = [...(prev.projects || []), ...data.data.projects];
          }

          return merged;
        });

        // Show merge prompt to confirm/adjust
        setShowMergePrompt(true);
        toast.success('Resume parsed and auto-filled! Review the details below.');
      }
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to parse resume');
      setUploadedResumeFile(null);
      setResumeFileName('');
    } finally {
      setUploading(false);
    }
  };

  const mergeResumeData = (overwrite = false) => {
    if (!resumePreview) return;

    setFormData(prev => {
      const merged = { ...prev };
      
      // Merge each field with option to overwrite or append
      if (resumePreview.name && (!prev.name || overwrite)) merged.name = resumePreview.name;
      if (resumePreview.email && (!prev.email || overwrite)) merged.email = resumePreview.email;
      if (resumePreview.phone && (!prev.phone || overwrite)) merged.phone = resumePreview.phone;
      if (resumePreview.summary && (!prev.summary || overwrite)) merged.summary = resumePreview.summary;

      // For arrays, append or overwrite
      if (resumePreview.skills?.length) {
        merged.skills = overwrite 
          ? resumePreview.skills 
          : Array.from(new Set([...(prev.skills || []), ...resumePreview.skills]));
      }
      if (resumePreview.experience?.length) {
        merged.experience = overwrite
          ? resumePreview.experience
          : [...(prev.experience || []), ...resumePreview.experience];
      }
      if (resumePreview.education?.length) {
        merged.education = overwrite
          ? resumePreview.education
          : [...(prev.education || []), ...resumePreview.education];
      }
      if (resumePreview.projects?.length) {
        merged.projects = overwrite
          ? resumePreview.projects
          : [...(prev.projects || []), ...resumePreview.projects];
      }

      return merged;
    });

    setResumePreview(null);
    setShowMergePrompt(false);
    toast.success('Resume data merged into profile!');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data } = await api.put('/api/users/profile', formData);
      if (data.success) {
        setProfile(formData);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const addArrayItem = (field: keyof UserProfile, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value],
    }));
  };

  const removeArrayItem = (field: keyof UserProfile, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <MainLayout showFooter={false}>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500 px-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Not Logged In</h2>
            <p className="text-gray-500 mb-6">Please log in to view your profile.</p>
            <Link href="/login" className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow hover:opacity-90 transition">
              Go to Login
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <div className="h-32 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <div className="px-8 pb-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16">
                <img
                  src={formData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=6C63FF&color=fff&size=128`}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800">{formData.name}</h1>
                  <p className="text-gray-600">{formData.email}</p>
                  <p className="text-sm text-gray-400">Member since {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <Button
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:opacity-90 transition"
                >
                  {isEditing ? (
                    <>
                      <Save size={16} className="mr-2 inline" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} className="mr-2 inline" />
                      Edit
                    </>
                  )}
                </Button>
                {isEditing && (
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(profile || {});
                    }}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition"
                  >
                    <X size={16} className="mr-2 inline" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Resume Upload */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-6 border-2 border-dashed border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">📄 Resume</h2>
                    <p className="text-sm text-gray-600 mt-1">Upload your resume to auto-fill your profile details</p>
                  </div>
                  <Upload size={32} className="text-purple-500 opacity-50" />
                </div>
                
                {/* Show uploaded resume file if exists */}
                {uploadedResumeFile && resumeFileName && (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-green-300 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle size={24} className="text-green-500" />
                        <div>
                          <p className="font-semibold text-gray-800">Resume Uploaded</p>
                          <p className="text-sm text-gray-600">{resumeFileName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedResumeFile(null);
                          setResumeFileName('');
                          setResumePreview(null);
                        }}
                        className="text-red-500 hover:text-red-700 font-semibold"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>
                )}
                
                {!isEditing ? (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100/50 transition">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <Upload size={32} className="text-purple-400 mb-2" />
                    <span className="text-purple-600 font-semibold">
                      {uploading ? 'Parsing resume...' : 'Click to upload resume (PDF, DOC, DOCX)'}
                    </span>
                  </label>
                ) : (
                  <p className="text-gray-600 text-sm italic">Resume upload disabled while editing. Save changes first.</p>
                )}
              </div>

              {/* Resume Merge Prompt Modal */}
              {showMergePrompt && resumePreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">✅ Resume Parsed Successfully!</h3>
                    <p className="text-sm text-gray-600 mb-6">Your profile details have been auto-filled with the resume data below:</p>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6 max-h-64 overflow-y-auto space-y-2">
                      {resumePreview.name && <p><strong>👤 Name:</strong> {resumePreview.name}</p>}
                      {resumePreview.email && <p><strong>📧 Email:</strong> {resumePreview.email}</p>}
                      {resumePreview.phone && <p><strong>📱 Phone:</strong> {resumePreview.phone}</p>}
                      {resumePreview.summary && <p><strong>📝 Summary:</strong> {resumePreview.summary.substring(0, 50)}...</p>}
                      {resumePreview.skills?.length > 0 && (
                        <p><strong>🛠️ Skills:</strong> {resumePreview.skills.length} found ({resumePreview.skills.slice(0, 3).join(', ')}...)</p>
                      )}
                      {resumePreview.experience?.length > 0 && (
                        <p><strong>💼 Experience:</strong> {resumePreview.experience.length} entries found</p>
                      )}
                      {resumePreview.education?.length > 0 && (
                        <p><strong>🎓 Education:</strong> {resumePreview.education.length} entries found</p>
                      )}
                      {resumePreview.projects?.length > 0 && (
                        <p><strong>🚀 Projects:</strong> {resumePreview.projects.length} entries found</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setShowMergePrompt(false);
                          setResumePreview(null);
                          toast.success('Profile updated with resume data!');
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:opacity-90"
                      >
                        <CheckCircle size={16} className="mr-2 inline" />
                        Done
                      </Button>
                      <Button
                        onClick={() => {
                          setShowMergePrompt(false);
                          setResumePreview(null);
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
                {isEditing ? (
                  <textarea
                    value={formData.summary || ''}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600">{formData.summary || 'No summary added yet. Click Edit to add one!'}</p>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(formData.skills || []).map((skill, idx) => (
                    <div key={idx} className="relative">
                      <Badge className="bg-purple-100 text-purple-800 px-4 py-2">{skill}</Badge>
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('skills', idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a skill..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('skills', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <Button className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600">
                      <Plus size={16} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Experience</h2>
                <div className="space-y-3">
                  {(formData.experience || []).map((exp, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{exp}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('experience', idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add experience..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('experience', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <Button className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600">
                      <Plus size={16} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Education</h2>
                <div className="space-y-3">
                  {(formData.education || []).map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{edu}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('education', idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add education..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('education', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <Button className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600">
                      <Plus size={16} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Projects */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Projects</h2>
                <div className="space-y-3">
                  {(formData.projects || []).map((project, idx) => (
                    <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{project}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeArrayItem('projects', idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isEditing && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add project..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addArrayItem('projects', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                    <Button className="bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600">
                      <Plus size={16} />
                    </Button>
                  </div>
                )}
              </div>

              {/* GitHub Repositories */}
              {formData.github_username && (
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">GitHub Projects</h2>
                    {loadingRepos && <span className="text-sm text-gray-500">Loading...</span>}
                  </div>
                  {githubRepos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {githubRepos.map((repo) => (
                        <a
                          key={repo.id}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-800 hover:text-blue-600">{repo.name}</h3>
                                {repo.language && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">{repo.language}</Badge>
                                )}
                              </div>
                              {repo.description && (
                                <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 ml-4 text-gray-600 text-sm">
                              <div className="flex items-center gap-1">
                                <Star size={14} />
                                <span>{repo.stars}</span>
                              </div>
                              <ExternalLink size={14} />
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No public repositories found on GitHub.</p>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Contact</h3>
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {formData.email && (
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-gray-800">{formData.email}</p>
                        </div>
                      )}
                      {formData.phone && (
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="text-gray-800">{formData.phone}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Social</h3>
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="text-sm text-gray-600">GitHub</label>
                        <input
                          type="text"
                          value={formData.github_username || ''}
                          onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                          placeholder="username"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">LinkedIn</label>
                        <input
                          type="url"
                          value={formData.linkedin_url || ''}
                          onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                          placeholder="https://linkedin.com/in/..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Portfolio</label>
                        <input
                          type="url"
                          value={formData.portfolio_url || ''}
                          onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {formData.github_username && (
                        <a href={`https://github.com/${formData.github_username}`} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                          → GitHub Profile
                        </a>
                      )}
                      {formData.linkedin_url && (
                        <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                          → LinkedIn Profile
                        </a>
                      )}
                      {formData.portfolio_url && (
                        <a href={formData.portfolio_url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                          → Portfolio Website
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
