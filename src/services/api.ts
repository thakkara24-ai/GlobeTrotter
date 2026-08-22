import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('globetrotter_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or unauthorized
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/shared')) {
        localStorage.removeItem('globetrotter_token');
        localStorage.removeItem('globetrotter_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
