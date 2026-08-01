import axios from 'axios';

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Send cookies (for JWT refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - runs before every request
api.interceptors.request.use(
  (config) => {
    // We don't manually attach the access token here if it's stored in an httpOnly cookie.
    // However, if we store it in Redux (for non-cookie based setups), we can attach it here.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles global API errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response.data; // Return only the data payload
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Avoid infinite loops if the refresh token endpoint itself returns 401
      if (originalRequest.url === '/auth/refresh') {
         return Promise.reject(error);
      }

      try {
        // Attempt to refresh token using httpOnly refresh token cookie
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed (e.g., expired or invalid)
        // We should dispatch a logout action here (handled via Redux/events later)
        return Promise.reject(refreshError);
      }
    }

    // Ensure both error.message and error.response.data.message work across the app
    error.message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(error);
  }
);

export default api;
