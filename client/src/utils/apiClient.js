import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAccessTokenSync } from '../lib/supabase';

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessTokenSync();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Added auth token to request headers');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

