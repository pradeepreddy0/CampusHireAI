// ============================================================
// api.js — Axios Instance with Auth Interceptor
//
// Creates a pre-configured Axios instance that:
//   - Points to the backend API URL (from .env)
//   - Automatically attaches the JWT token to every request
//   - Handles 401 responses by redirecting to login
// ============================================================

import axios from 'axios'

// Create Axios instance with base URL from environment
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// ── Request Interceptor: attach JWT token ───────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Response Interceptor: handle auth errors ────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear storage and redirect
            localStorage.removeItem('token')
            localStorage.removeItem('role')
            localStorage.removeItem('user_id')
            localStorage.removeItem('user_name')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
