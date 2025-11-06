const conf = {
    // API configuration
    // Production backend: https://uniso-backend.onrender.com
    apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'),
}

export default conf;