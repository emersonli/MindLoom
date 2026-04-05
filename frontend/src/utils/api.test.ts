import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, notesApi, searchApi, tagsApi, authApi, versionsApi } from './api'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock user store
vi.mock('../stores/userStore', () => ({
  useUserStore: {
    getState: vi.fn(() => ({ token: 'test-token' })),
  },
}))

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should use default API URL', () => {
      const client = new (apiClient.constructor as any)()
      expect(client.baseUrl).toBeDefined()
    })

    it('should accept custom base URL', () => {
      const client = new (apiClient.constructor as any)('http://custom-api.com')
      expect(client.baseUrl).toBe('http://custom-api.com')
    })
  })

  describe('GET requests', () => {
    it('should make GET request with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      })

      const result = await apiClient.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      )
      expect(result.data).toEqual({ data: 'test' })
    })

    it('should make GET request without auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      })

      await apiClient.get('/test', false)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      )
    })

    it('should handle 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await apiClient.get('/test')
      expect(result.data).toBeUndefined()
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'Network error. Please check your connection.',
        status: 0,
      })
    })
  })

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: '123' }),
      })

      const result = await apiClient.post('/test', { name: 'test' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
      expect(result.data).toEqual({ id: '123' })
    })

    it('should make POST request without data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })

      await apiClient.post('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      )
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ updated: true }),
      })

      const result = await apiClient.put('/test/123', { name: 'updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/test/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        })
      )
      expect(result.data).toEqual({ updated: true })
    })
  })

  describe('PATCH requests', () => {
    it('should make PATCH request with data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ patched: true }),
      })

      const result = await apiClient.patch('/test/123', { name: 'patched' })

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/test/123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'patched' }),
        })
      )
      expect(result.data).toEqual({ patched: true })
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      await apiClient.delete('/test/123')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:4000/test/123',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Error handling', () => {
    it('should handle API errors with JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request', code: 'INVALID_INPUT' }),
      })

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'Bad request',
        status: 400,
        code: 'INVALID_INPUT',
      })
    })

    it('should handle API errors without JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON') },
      })

      await expect(apiClient.get('/test')).rejects.toEqual({
        message: 'HTTP error! status: 500',
        status: 500,
        code: undefined,
      })
    })

    it('should handle 401 Unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: 401,
      })
    })

    it('should handle 404 Not Found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      })

      await expect(apiClient.get('/test')).rejects.toMatchObject({
        status: 404,
      })
    })
  })
})

describe('Notes API', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })
  })

  it('should get all notes', async () => {
    await notesApi.getAll()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notes',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should get note by ID', async () => {
    await notesApi.getById('123')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notes/123',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should create note', async () => {
    await notesApi.create('Test Note', 'Content')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notes',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'Test Note', content: 'Content' }),
      })
    )
  })

  it('should update note', async () => {
    await notesApi.update('123', { title: 'Updated' })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notes/123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      })
    )
  })

  it('should delete note', async () => {
    await notesApi.delete('123')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notes/123',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('Search API', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [] }),
    })
  })

  it('should search with query', async () => {
    await searchApi.search('test')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/search?q=test',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should search with limit', async () => {
    await searchApi.search('test', 10)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/search?q=test&limit=10',
      expect.objectContaining({ method: 'GET' })
    )
  })
})

describe('Tags API', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ tags: [] }),
    })
  })

  it('should get all tags', async () => {
    await tagsApi.getAll()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/tags',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should get tags by note', async () => {
    await tagsApi.getByNote('123')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/notes/123/tags',
      expect.objectContaining({ method: 'GET' })
    )
  })
})

describe('Auth API', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: {}, token: 'new-token' }),
    })
  })

  it('should login', async () => {
    await authApi.login('test@example.com', 'password')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })
    )
  })

  it('should register', async () => {
    await authApi.register('test@example.com', 'password', 'Test User')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password', name: 'Test User' }),
      })
    )
  })

  it('should logout', async () => {
    await authApi.logout()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/logout',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('should refresh token', async () => {
    await authApi.refreshToken()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/refresh',
      expect.objectContaining({ method: 'POST' })
    )
  })
})

describe('Versions API', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })
  })

  it('should get versions for note', async () => {
    await versionsApi.getVersions('123')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/versions/notes/123/versions',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should get version by ID', async () => {
    await versionsApi.getVersion('v1')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/versions/v1',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('should restore version', async () => {
    await versionsApi.restoreVersion('v1', '123')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/versions/v1/restore',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ noteId: '123' }),
      })
    )
  })
})
