import axios from 'axios';
import { getAuth } from 'firebase/auth';
import toast from 'react-hot-toast';

// Create a configured Axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Firebase ID Token automatically
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // Force refresh if near expiration (handled by Firebase under the hood mostly)
        const token = await user.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error fetching auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error response exists
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized: Could trigger a logout or token refresh if not handled by Firebase
          toast.error('Session expired. Please log in again.');
          // Optional: window.location.href = '/login';
          break;
        case 403:
          toast.error(data.message || 'You do not have permission to perform this action.');
          break;
        case 404:
          console.warn('API Endpoint not found:', error.config.url);
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Network errors
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API Service exports for modules to consume easily
export const authApi = {
  sendOtp: (phone: string) => api.post('/api/v1/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/api/v1/auth/verify-otp', { phone, code }),
};

export const dashboardApi = {
  get: () => api.get('/api/v1/module2/dashboard'),
};

export const eventsApi = {
  getAll: (params?: any) => api.get('/api/v1/events', { params }),
  getById: (id: string) => api.get(`/api/v1/events/${id}`),
  register: (id: string, data?: any) => api.post(`/api/v1/events/${id}/register`, data),
};

export const mentorsApi = {
  getAll: (params?: any) => api.get('/api/v1/mentors', { params }),
  getById: (id: string) => api.get(`/api/v1/mentors/${id}`),
  bookSession: (id: string, data: any) => api.post(`/api/v1/mentors/${id}/book`, data),
  getReviews: (id: string) => api.get(`/api/v1/mentors/${id}/reviews`),
  submitReview: (id: string, data: any) => api.post(`/api/v1/mentors/${id}/reviews`, data),
};

export const communityApi = {
  getFeed: (params?: any) => api.get('/api/v1/community', { params }),
  createPost: (data: any) => api.post('/api/v1/community', data),
};

export const paymentsApi = {
  createOrder: (data: any) => api.post('/api/v1/payments/create-order', data),
  verify: (data: any) => api.post('/api/v1/payments/verify', data),
};
