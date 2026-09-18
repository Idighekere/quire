import { ENVIRONMENT } from "@/config";
import axios from "axios";
import toast from "react-hot-toast";

const apiClient = axios.create({
  baseURL: ENVIRONMENT.APP.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const api = {
  getCourses: async (department, level, semester) => {
    const response = await apiClient.get("/courses", {
      params: { department, level, semester },
    });
    return response.data;
  },

  getBooksByCourse: async (courseCode, params = {}) => {
    if (!courseCode) return [];
    const response = await apiClient.get(`/books/course/${courseCode}`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 12,
        category: params.category || "",
        search: params.search || "",
      },
    });
    return response.data;
  },

  getAllBooks: async (params = {}) => {
    const response = await apiClient.get("/books/all", {
      params: {
        page: params.page || 1,
        limit: params.limit || 12,
        search: params.search || "",
        category: params.category || "",
      },
    });
    return response.data;
  },

  getBooksByUser: async (params = {}) => {
    const response = await apiClient.get(`/books/`, { params });
    return response.data;
  },

  getCoursesByUser: async (params = {}) => {
    const response = await apiClient.get(`/courses/me`, { params });
    return response.data;
  },

  addCourse: async (formData) => {
    //console.log(formData)
    const response = await apiClient.post(`/courses/`, formData);

    return response.data;
  },

  updateCourse: async (id, formData) => {
    const response = await apiClient.patch(`/courses/${id}`, formData);

    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await apiClient.delete(`/courses/${id}`);

    return response.data;
  },

  addBook: async (formData) => {
    const response = await apiClient.post(`/books/`, formData);

    return response.data;
  },

  updateBook: async (id, formData) => {
    const response = await apiClient.patch(`/books/${id}`, formData);

    return response.data;
  },

  deleteBook: async (id) => {
    const response = await apiClient.delete(`/books/${id}`);

    return response.data;
  },

  lookupCourse: async (courseCode) => {
    const response = await apiClient.get(`/courses/lookup/${encodeURIComponent(courseCode)}`);
    return response.data;
  },

  getDepartments: async () => {
    const response = await apiClient.get("/departments");
    return response.data;
  },

  uploadBookFile: async (formData, onProgress) => {
    const response = await apiClient.post("/upload/book", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (typeof onProgress !== "function") return;
        const total = progressEvent.total;
        if (!total || total <= 0) return;
        onProgress(Math.round((progressEvent.loaded * 100) / total));
      },
    });
    return response.data;
  },

  // Requests
  listRequests: async (params = {}) => {
    const response = await apiClient.get("/requests", { params });
    return response.data;
  },
  createRequest: async (formData) => {
    const response = await apiClient.post("/requests", formData);
    return response.data;
  },
  upvoteRequest: async (requestId) => {
    const response = await apiClient.post(`/requests/${requestId}/want`);
    return response.data;
  },
  fulfillRequest: async (requestId, bookId) => {
    const response = await apiClient.post(`/requests/${requestId}/fulfill`, { bookId });
    return response.data;
  },

  // Moderation + Drive sync (admin)
  getPendingBooks: async (params = {}) => {
    const response = await apiClient.get("/books/pending", { params });
    return response.data;
  },
  moderateBook: async (bookId, status) => {
    const response = await apiClient.patch(`/books/${bookId}/status`, { status });
    return response.data;
  },
  syncDrive: async (category = "") => {
    const response = await apiClient.post("/sync", {}, {
      params: category ? { category } : {},
    });
    return response.data;
  },
  getPickerToken: async () => {
    const response = await apiClient.get("/sync/picker-token");
    return response.data;
  },
  getMyPickerToken: async () => {
    const response = await apiClient.get("/sync/my-picker-token");
    return response.data;
  },
  importFromMyDrive: async (payload) => {
    const response = await apiClient.post("/sync/my-import", payload);
    return response.data;
  },
  importPickedFiles: async (fileIds, { category = "", makePublic = false } = {}) => {
    const response = await apiClient.post("/sync/import", { fileIds, makePublic }, {
      params: category ? { category } : {},
    });
    return response.data;
  },
  getGoogleDriveStatus: async () => {
    const response = await apiClient.get("/auth/google/status");
    return response.data;
  },
  disconnectGoogleDrive: async () => {
    const response = await apiClient.delete("/auth/google/connection");
    return response.data;
  },
};

export const authApi = {
  login: async (formData) => {
    const response = await apiClient.post(`/auth/login/`, formData);

    return response.data;
  },
  register: async (formData) => {
    const response = await apiClient.post(`/auth/register/`, formData);

    return response.data;
  },
  logout: async () => {
    const response = await apiClient.post(`/auth/logout/`);

    return response.data;
  },
  getCurrentUser: async () => {
    const response = await apiClient.get(`/users/me/`);
    return response.data;
  },
};

// Track rate limiting state
let isRateLimited = false;
let rateLimitResetTime = null;

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check specifically for rate limit errors
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const resetTime = error.response.headers["x-ratelimit-reset"];

      // Calculate when rate limit will reset
      rateLimitResetTime = resetTime
        ? new Date(parseInt(resetTime) * 1000)
        : new Date(Date.now() + (parseInt(retryAfter) || 60) * 1000);

      isRateLimited = true;

      // Create a specific error type for rate limiting
      const rateLimitError = new Error("Too many requests");
      rateLimitError.isRateLimit = true;
      rateLimitError.retryAfter = retryAfter ? parseInt(retryAfter) : 60;
      rateLimitError.resetTime = rateLimitResetTime;

      // Show a toast notification
      toast.error(
        `Rate limit exceeded. Please try again in ${rateLimitError.retryAfter ? `${rateLimitError.retryAfter} seconds` : `15 minutes`}`,
        { duration: Math.min(rateLimitError.retryAfter * 1000, 8000) },
      );

      // Set a timeout to clear the rate limit flag
      setTimeout(() => {
        isRateLimited = false;
        rateLimitResetTime = null;
      }, rateLimitError.retryAfter * 1000);

      return Promise.reject(rateLimitError);
    }

    // Pass through other errors
    return Promise.reject(error);
  },
);

// Request interceptor to prevent requests during rate limiting
apiClient.interceptors.request.use(
  (config) => {
    if (isRateLimited) {
      const now = new Date();
      const remainingSeconds = Math.ceil((rateLimitResetTime - now) / 1000);

      if (remainingSeconds > 0) {
        const rateLimitError = new Error(
          `Rate limited. Please wait ${remainingSeconds} seconds.`,
        );
        rateLimitError.isRateLimit = true;
        rateLimitError.retryAfter = remainingSeconds;

        return Promise.reject(rateLimitError);
      }

      isRateLimited = false;
      rateLimitResetTime = null;
    }

    return config;
  },
  (error) => Promise.reject(error),
);
