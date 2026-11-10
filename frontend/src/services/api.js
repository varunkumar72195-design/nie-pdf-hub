
import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api",
  timeout: 15000,
});

// Authentication interceptor
API.interceptors.request.use(
  (config) => {
    if (config.requiresAuth) {
      const token = sessionStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    delete config.requiresAuth;

    // Do not manually modify Content-Type.
    // Axios automatically handles JSON and FormData.

    return config;
  },
  (error) => Promise.reject(error)
);

// Error interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Request Failed:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      response: error.response?.data,
    });

    return Promise.reject(error);
  }
);

export default API;
