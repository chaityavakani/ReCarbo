import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recarbo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('recarbo_token');
      // If unauthorized on protected routes, redirect could happen via context
    }
    return Promise.reject(error);
  }
);

export default api;
