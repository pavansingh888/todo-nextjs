// /Users/pavan/Desktop/todo-nextjs/lib/axios.ts
import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";

/**
 * Axios instance configured for HttpOnly cookie-based auth and proxying via Next.js API (/api).
 *
 * Notes:
 * - baseURL is /api (we proxy to dummyjson via Next.js server routes)
 * - withCredentials: true ensures browser cookies are sent to our Next API
 * - On 401 responses we call /api/auth/refresh (server will call dummyjson refresh)
 *   and retry the original request once. While refresh is in progress, other requests
 *   will wait in a queue and be retried when refresh completes.
 */

// Use Next.js internal API as the base
const BASE = "/api";

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  // custom flag to avoid infinite retry loops
  _retry?: boolean;
}

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  timeout: 15000, // 15s
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Refresh token logic ---
// Keeps track of refresh-in-progress and queues requests while refreshing.
let isRefreshing = false;
type QueueItem = {
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: any) => void;
  originalRequest: CustomAxiosRequestConfig;
};
let failedQueue: QueueItem[] = [];

const processQueue = (error: any | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      // Retry the request and resolve with the response
      api(p.originalRequest)
        .then((response) => p.resolve(response))
        .catch((err) => p.reject(err));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError & { config?: CustomAxiosRequestConfig }) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    // Safety: if no response or no originalRequest, just forward the error
    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Only attempt refresh for 401 Unauthorized
    if (
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      // mark this request as retried (avoid loops)
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request and return a promise that will be resolved when refresh completes
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest });
        });
      }

      isRefreshing = true;

      try {
        // Call refresh endpoint on our Next API proxy. The server should call dummyjson refresh
        // and set new cookies (HttpOnly). We don't need the response body here.
        await api.post("/auth/refresh", {}, { withCredentials: true });

        // Refresh successful: process queued requests (they will retry themselves)
        processQueue(null);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed: reject all queued requests and propagate error
        processQueue(refreshError);
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    // For other statuses or if conditions not met, just reject
    return Promise.reject(error);
  }
);

export default api;