import axios from 'axios';

const TOKEN_KEY = 'anx_token';
const USER_KEY = 'anx_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  // Also set cookie for SSR middleware
  document.cookie = `session=${token}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = 'session=; path=/; max-age=0';
}

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Clear session and redirect to login
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Network error
    if (!error.response) {
      console.error('[API] Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Typed API helpers ──────────────────────────────────────────────────────

export const authApi = {
  sendOtp: (phoneNumber: string) =>
    api.post('/auth/send-otp', { phoneNumber }),

  verifyOtp: (phoneNumber: string, otp: string) =>
    api.post('/auth/verify-otp', { phoneNumber, otp }),
};

export const dashboardApi = {
  get: (userId: string) =>
    api.get(`/module2/dashboard`, { params: { userId }, headers: { 'x-user-id': userId } }),
};

export const eventsApi = {
  list: (params?: { type?: string; upcoming?: boolean }) =>
    api.get('/events', { params }),

  get: (id: string) =>
    api.get(`/events/${id}`),

  register: (id: string) =>
    api.post(`/events/${id}/register`),

  getRegistrations: (id: string) =>
    api.get(`/events/${id}/registrations`),
};

export const mentorsApi = {
  list: () =>
    api.get('/mentors'),

  get: (id: string) =>
    api.get(`/mentors/${id}`),

  book: (id: string, data: any) =>
    api.post(`/mentors/${id}/book`, data),

  getReviews: (id: string) =>
    api.get(`/mentors/${id}/reviews`),

  addReview: (id: string, data: any) =>
    api.post(`/mentors/${id}/reviews`, data),
};

export const communityApi = {
  list: () =>
    api.get('/community'),

  create: (data: { title: string; content: string; type: string; tags?: string[]; authorId: string; authorName: string }) =>
    api.post('/community', data),
};

export const paymentsApi = {
  createOrder: (data: { amount: number; eventId?: string; membershipType?: string }) =>
    api.post('/payments/create-order', data),

  verify: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/payments/verify', data),
};

export const chatsApi = {
  send: (data: { message: string; receiverId?: string }) =>
    api.post('/chats', data),
};

export const adminApi = {
  // Events
  getEvents: () => api.get('/admin/events'),
  approveEvent: (id: string) => api.patch(`/admin/events/${id}/approve`),
  getEventRegistrations: (id: string) => api.get(`/admin/events/${id}/registrations`),

  // Mentors
  addMentor: (data: any) => api.post('/admin/mentors', data),
  updateMentorRequest: (id: string, data: any) => api.patch(`/admin/mentor-requests/${id}`, data),

  // Users
  updateUser: (data: any) => api.post('/admin/users/update', data),

  // Projects
  updateProject: (data: any) => api.post('/admin/projects/update', data),
};
