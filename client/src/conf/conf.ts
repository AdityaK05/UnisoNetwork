const conf = {
    // API configuration
    // In production, VITE_API_BASE_URL should point to your Render backend URL
    // e.g., https://uniso-backend.onrender.com
    apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'),
}

export default conf;