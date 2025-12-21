// src/services/api.js
import axios from "axios";

// 🌐 Read Vite env variable
const baseURL = import.meta.env.VITE_API_URL ||'https://nomadnet.onrender.com';

console.log("🌐 Loaded Base URL:", baseURL);

// Create axios instance
const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================
   📤 REQUEST INTERCEPTOR
============================ */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(
      "📤 API Request:",
      config.method?.toUpperCase(),
      config.url
    );
    console.log("🔑 Token:", token ? "Present ✅" : "Missing ❌");
    console.log("🌐 Full URL:", `${config.baseURL}${config.url}`);

    // 📦 Log request payload
    if (config.data) {
      if (config.data instanceof FormData) {
        console.log("📦 Request Type: FormData");
        console.log("📋 FormData contents:");
        for (let pair of config.data.entries()) {
          if (pair[1] instanceof File) {
            console.log(
              `  ${pair[0]}: [File: ${pair[1].name}, ${pair[1].type}, ${pair[1].size} bytes]`
            );
          } else {
            console.log(`  ${pair[0]}:`, pair[1]);
          }
        }
      } else {
        console.log("📦 Request Type: JSON");
        console.log(
          "📋 Request Data:",
          JSON.stringify(config.data, null, 2)
        );
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================
   📥 RESPONSE INTERCEPTOR
============================ */
api.interceptors.response.use(
  (response) => {
    console.log(
      "📥 API Response:",
      response.status,
      response.config.url
    );
    return response;
  },
  (error) => {
    // 🔌 No response (network / CORS / server down)
    if (!error.response) {
      console.error("❌ Network error - no response received");
      return Promise.reject(error);
    }

    const { status, data, config } = error.response;

    console.error("❌ API Error:", status, config?.url);
    console.error("❌ Error message:", data?.message);
    console.error("❌ Full error data:", data);

    // 🔍 Validation / detailed errors
    if (data?.errors) console.error("❌ Validation errors:", data.errors);
    if (data?.details) console.error("❌ Error details:", data.details);
    if (data?.error) console.error("❌ Error:", data.error);

    // 🚪 Auth handling
    if (status === 401) {
      console.warn("🚪 Unauthorized - clearing auth and redirecting");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      window.location.href = "/";
    }

    // 🚦 Status-specific handling
    switch (status) {
      case 403:
        console.error("🚫 Permission denied (403)");
        break;
      case 404:
        console.error("🔍 Resource not found (404)");
        break;
      case 500:
        console.error("💥 Server error (500)");
        break;
      default:
        console.error("⚠️ API Error:", data?.message || "Unknown error");
    }

    return Promise.reject(error);
  }
);

/* ============================
   🧰 API HELPER METHODS
============================ */
export const apiHelper = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;
