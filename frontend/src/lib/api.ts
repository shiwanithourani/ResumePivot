import axios from 'axios';

//const API_BASE_URL = 'http://localhost:3001/api';
const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ FIX: Enhanced request interceptor with better logging
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token attached:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ FIX: Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;