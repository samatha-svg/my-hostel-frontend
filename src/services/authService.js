import axios from 'axios';

// Live Render Auth API URL
const AUTH_API_URL = 'https://my-hostel-backend.onrender.com/api/auth';

const authApi = axios.create({
  baseURL: AUTH_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const authService = {
  // Register new user (Student or Warden)
  register: async (userData) => {
    const response = await authApi.post('/register', userData);
    if (response.data) {
      localStorage.setItem('hostel_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await authApi.post('/login', { email, password });
    if (response.data) {
      localStorage.setItem('hostel_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Get currently logged-in user from storage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('hostel_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('hostel_user');
  },
};

export default authService;
