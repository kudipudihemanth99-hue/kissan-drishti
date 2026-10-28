/**
 * Dynamic API configuration for Kissan Drishti frontend.
 *
 * In production, set VITE_API_URL to your deployed backend (e.g., https://kissan-drishti-backend.onrender.com).
 * In local development, leaving VITE_API_URL unset will default to relative '/api' paths proxied by Vite.
 */
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

// Cleanly remove any trailing slashes to avoid '//' path anomalies
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const API_ENDPOINTS = {
  diagnose: API_BASE_URL ? `${API_BASE_URL}/api/diagnose` : '/api/diagnose',
  chat: API_BASE_URL ? `${API_BASE_URL}/api/chat` : '/api/chat',
  health: API_BASE_URL ? `${API_BASE_URL}/api/health` : '/api/health',
};

export default API_ENDPOINTS;
