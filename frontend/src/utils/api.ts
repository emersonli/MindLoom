import { useUserStore } from '../stores/userStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

/**
 * API Client for MindLoom PKMS
 * Handles authentication, error handling, and request/response transformation
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from user store
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return useUserStore.getState().token;
  }

  /**
   * Build headers for API requests
   */
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorCode: string | undefined;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code;
      } catch {
        // Response might not be JSON
      }

      const error: ApiError = {
        message: errorMessage,
        status: response.status,
        code: errorCode,
      };

      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: undefined as T };
    }

    try {
      const data = await response.json();
      return { data };
    } catch {
      return { data: undefined as T };
    }
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  /**
   * Generic PUT request
   */
  async put<T>(
    endpoint: string,
    data: unknown,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: unknown,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(includeAuth),
        body: JSON.stringify(data),
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    file: File,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = this.getHeaders(includeAuth) as Record<string, string>;
      delete headers['Content-Type']; // Let browser set it with boundary

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return await this.handleResponse<T>(response);
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: 'Network error. Please check your connection.',
        status: 0,
      } as ApiError;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export API endpoints for notes
export const notesApi = {
  getAll: () => apiClient.get<{ notes: any[] }>('/api/notes'),
  getById: (id: string) => apiClient.get<any>(`/api/notes/${id}`),
  create: (title: string, content?: string) =>
    apiClient.post<any>('/api/notes', { title, content }),
  update: (id: string, updates: Partial<any>) =>
    apiClient.put<any>(`/api/notes/${id}`, updates),
  delete: (id: string) => apiClient.delete(`/api/notes/${id}`),
};

// Export API endpoints for search
export const searchApi = {
  search: (query: string, limit?: number) => {
    const params = new URLSearchParams({ q: query });
    if (limit) params.append('limit', limit.toString());
    return apiClient.get<{ results: any[] }>(`/api/search?${params}`);
  },
};

// Export API endpoints for tags
export const tagsApi = {
  getAll: () => apiClient.get<{ tags: any[] }>('/api/tags'),
  getByNote: (noteId: string) => apiClient.get<{ tags: any[] }>(`/api/notes/${noteId}/tags`),
};

// Export API endpoints for auth
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ user: any; token: string }>('/api/auth/login', { email, password }),
  register: (email: string, password: string, name?: string) =>
    apiClient.post<{ user: any; token: string }>('/api/auth/register', { email, password, name }),
  logout: () => apiClient.post('/api/auth/logout', undefined, true),
  refreshToken: () => apiClient.post<{ token: string }>('/api/auth/refresh'),
};

// Export API endpoints for export
export const exportApi = {
  markdown: (noteId: string) => apiClient.get<string>(`/api/export/${noteId}/md`, false),
  pdf: (noteId: string) => apiClient.get<Blob>(`/api/export/${noteId}/pdf`, false),
  html: (noteId: string) => apiClient.get<string>(`/api/export/${noteId}/html`, false),
};

export default apiClient;
