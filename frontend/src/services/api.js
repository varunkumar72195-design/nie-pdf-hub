import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000/api",
  timeout: 60000,
});

// ==========================================
// ANONYMOUS VISITOR ID
// ==========================================

function getVisitorId() {
  let visitorId = localStorage.getItem("nie_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("nie_visitor_id", visitorId);
  }

  return visitorId;
}

// ==========================================
// ANONYMOUS SESSION ID
// ==========================================

function getSessionId() {
  let sessionId = sessionStorage.getItem("nie_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("nie_session_id", sessionId);
  }

  return sessionId;
}

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

API.interceptors.request.use(
  (config) => {
    // Admin authentication
    if (config.requiresAuth) {
      const token = sessionStorage.getItem("access_token");

      config.headers = config.headers || {};

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    delete config.requiresAuth;

    // Anonymous analytics headers
    config.headers = config.headers || {};

    config.headers["X-Visitor-ID"] = getVisitorId();
    config.headers["X-Session-ID"] = getSessionId();

    // Axios automatically handles JSON and FormData.
    // Do not manually modify Content-Type.

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

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