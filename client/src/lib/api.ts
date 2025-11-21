// API utility for making requests to the backend.
// Behavior:
// - If VITE_API_BASE_URL is provided at build time and points to an external backend, use it.
// - If it's missing or points to the current frontend origin (common misconfig on Vercel),
//   fall back to the known Render backend URL to avoid requests hitting the frontend and causing 405s.
const DEFAULT_BACKEND = 'https://uniso-backend.onrender.com';

function resolveBaseUrl(): string {
  // Build-time env (may be undefined)
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

  // Prefer explicit env when it's set and non-empty
  let base = envBase && envBase.trim() !== '' ? envBase.trim() : DEFAULT_BACKEND;

  // Runtime safety: if running in the browser and the configured base points to this page's origin
  // (for example Vercel misconfig where VITE_API_BASE_URL was set to the frontend origin),
  // override to the default backend to prevent calls to the frontend origin.
  if (typeof window !== 'undefined') {
    try {
      const host = window.location.hostname;
      if (base.includes(host) || base.includes('.vercel.app')) {
        base = DEFAULT_BACKEND;
      }
    } catch (e) {
      // ignore and use whatever base we resolved
    }
  }

  // Ensure no trailing slash
  return base.replace(/\/$/, '');
}

export const apiUrl = (path: string): string => {
  const base = resolveBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

export const apiFetch = async (path: string, options?: RequestInit) => {
  return fetch(apiUrl(path), options);
};

export default apiUrl;
