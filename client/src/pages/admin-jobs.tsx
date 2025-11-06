import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Job {
  id: number;
  title: string;
  company_name: string;
  description: string;
  location: string;
  job_type: 'Internship' | 'Full-time' | 'Part-time';
  salary_range: string;
  skills_required: string[];
  application_deadline: string;
  application_link: string;
  status: 'Active' | 'Closed';
  posted_at: string;
  posted_by_name: string;
}

const AdminJobPortal: React.FC = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    description: '',
    location: '',
    job_type: 'Internship' as 'Internship' | 'Full-time' | 'Part-time',
    salary_range: '',
    skills_required: '',
    application_deadline: '',
    application_link: '',
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingJob ? `/api/admin/jobs/${editingJob.id}` : '/api/admin/jobs';
      const method = editingJob ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingJob ? 'Job updated successfully!' : 'Job posted successfully!');
        setShowForm(false);
        setEditingJob(null);
        resetForm();
        fetchJobs();
      } else {
        toast.error(data.message || 'Failed to save job');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company_name: job.company_name,
      description: job.description || '',
      location: job.location || '',
      job_type: job.job_type,
      salary_range: job.salary_range || '',
      skills_required: job.skills_required?.join(', ') || '',
      application_deadline: job.application_deadline?.split('T')[0] || '',
      application_link: job.application_link || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Job deleted successfully!');
        fetchJobs();
      } else {
        toast.error(data.message || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const handleToggleStatus = async (job: Job) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = job.status === 'Active' ? 'Closed' : 'Active';

      const response = await fetch(`/api/admin/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Job ${newStatus === 'Active' ? 'activated' : 'closed'} successfully!`);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update job status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company_name: '',
      description: '',
      location: '',
      job_type: 'Internship',
      salary_range: '',
      skills_required: '',
      application_deadline: '',
      application_link: '',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Job Portal Admin</h1>
            <p className="text-gray-600 mt-2">Manage job and internship postings</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingJob(null);
                resetForm();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Post New Job'}
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8 bg-white shadow-lg">
            <h2 className="text-2xl font-bold mb-6">
              {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Software Engineer Intern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type *
                  </label>
                  <select
                    required
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Remote, Bangalore"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., ₹5-8 LPA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills Required (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills_required}
                  onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., React, Node.js, MongoDB"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Link
                </label>
                <input
                  type="url"
                  value={formData.application_link}
                  onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://company.com/apply"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Describe the role, responsibilities, requirements..."
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingJob(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Job Postings ({jobs.length})</h2>
          
          {jobs.length === 0 ? (
            <Card className="p-12 text-center bg-white">
              <p className="text-gray-500 text-lg">No job postings yet. Create your first one!</p>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="p-6 bg-white shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          job.status === 'Active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {job.job_type}
                      </span>
                    </div>
                    <p className="text-lg text-gray-700 font-semibold">{job.company_name}</p>
                    {job.location && (
                      <p className="text-sm text-gray-600">📍 {job.location}</p>
                    )}
                    {job.salary_range && (
                      <p className="text-sm text-gray-600 mt-1">💰 {job.salary_range}</p>
                    )}
                    {job.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                    )}
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.skills_required.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      Posted on {new Date(job.posted_at).toLocaleDateString()}
                      {job.application_deadline && ` • Deadline: ${new Date(job.application_deadline).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => handleEdit(job)}
                      variant="outline"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleToggleStatus(job)}
                      variant="outline"
                      size="sm"
                      className={job.status === 'Active' ? 'text-orange-600' : 'text-green-600'}
                    >
                      {job.status === 'Active' ? 'Close' : 'Activate'}
                    </Button>
                    <Button
                      onClick={() => handleDelete(job.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminJobPortal;
