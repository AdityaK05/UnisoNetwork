// API utility for making requests to the backend
// Prefer build-time env var VITE_API_BASE_URL. If not set (e.g. older builds),
// default to the known backend URL so the deployed frontend doesn't call itself.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://uniso-backend.onrender.com';

export const apiUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const apiFetch = async (path: string, options?: RequestInit) => {
  return fetch(apiUrl(path), options);
};

export default apiUrl;
