/**
 * Shared API Client
 *
 * This module provides a centralized HTTP client for all API calls.
 * It automatically injects Firebase ID tokens for authentication.
 *
 * Exposed via Module Federation so child apps can use the same client.
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3010/api/v1';

// Retry configuration for network errors only
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second, doubles each retry

// Standard API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Check if error is a network error (no response received)
 * These are retryable: timeouts, connection refused, DNS failures, etc.
 */
const isNetworkError = (error: AxiosError): boolean => {
  // No response means network-level failure
  if (!error.response) {
    // Check specific error codes
    const code = error.code;
    return (
      code === 'ECONNABORTED' || // Timeout
      code === 'ECONNREFUSED' || // Connection refused
      code === 'ENOTFOUND' ||    // DNS failure
      code === 'ENETUNREACH' ||  // Network unreachable
      code === 'ERR_NETWORK' ||  // Generic network error
      error.message === 'Network Error'
    );
  }
  return false;
};

/**
 * Sleep for a given number of milliseconds
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Firebase ID token and retry metadata
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[API] Error getting auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and retry network failures
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Handle 401 - token expired or invalid
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized - token may be expired');
      // Try to refresh token
      try {
        const user = auth.currentUser;
        if (user) {
          await user.getIdToken(true); // Force refresh
          // Retry the original request
          if (config) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
            return apiClient.request(config);
          }
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
      }
    }

    // Retry logic for network errors only (not 4xx/5xx)
    if (isNetworkError(error) && config) {
      const retryCount = config._retryCount || 0;

      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff

        console.warn(
          `[API] Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          { url: config.url, code: error.code }
        );

        await sleep(delay);
        return apiClient.request(config);
      }

      console.error(
        `[API] Network error after ${MAX_RETRIES} retries, giving up`,
        { url: config.url, code: error.code }
      );
    }

    // Extract error message from response
    const errorMessage = error.response?.data?.error?.message
      || error.message
      || 'An unexpected error occurred';

    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Request failed:', {
        url: config?.url,
        method: config?.method,
        status: error.response?.status,
        code: error.code,
        message: errorMessage,
      });
    }

    return Promise.reject(error);
  }
);

// Helper functions for common operations
export const api = {
  // GET request
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    return response.data;
  },

  // POST request
  post: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data);
    return response.data;
  },

  // PUT request
  put: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data);
    return response.data;
  },

  // PATCH request
  patch: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data);
    return response.data;
  },

  // DELETE request
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url);
    return response.data;
  },
};

// Export the raw axios instance for advanced use cases
export { apiClient };

// Export base URL for reference
export const getApiBaseUrl = () => API_BASE_URL;

export default api;
