import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNotesStore } from './notesStore'
import { Note } from '../types'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useNotesStore', () => {
  const mockNotes: Note[] = [
    {
      id: '1',
      title: 'Test Note 1',
      content: '<p>Content 1</p>',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: [],
    },
    {
      id: '2',
      title: 'Test Note 2',
      content: '<p>Content 2</p>',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: ['tag1'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store to initial state
    useNotesStore.setState({
      notes: [],
      selectedNote: null,
      isLoading: false,
      error: null,
      lastSynced: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useNotesStore.getState()

      expect(state.notes).toEqual([])
      expect(state.selectedNote).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.lastSynced).toBeNull()
    })
  })

  describe('fetchNotes', () => {
    it('should fetch notes successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: mockNotes }),
      })

      await useNotesStore.getState().fetchNotes()

      const state = useNotesStore.getState()
      expect(state.notes).toEqual(mockNotes)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.lastSynced).toBeDefined()
    })

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await useNotesStore.getState().fetchNotes()

      const state = useNotesStore.getState()
      expect(state.notes).toEqual([])
      expect(state.isLoading).toBe(false)
      expect(state.error).toBe('HTTP error! status: 500')
    })

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await useNotesStore.getState().fetchNotes()

      const state = useNotesStore.getState()
      expect(state.error).toBe('Network error')
    })

    it('should set loading state during fetch', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ notes: mockNotes }),
        }), 10))
      )

      const fetchPromise = useNotesStore.getState().fetchNotes()
      expect(useNotesStore.getState().isLoading).toBe(true)

      await fetchPromise
      expect(useNotesStore.getState().isLoading).toBe(false)
    })
  })

  describe('fetchNote', () => {
    it('should fetch single note successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotes[0],
      })

      await useNotesStore.getState().fetchNote('1')

      const state = useNotesStore.getState()
      expect(state.selectedNote).toEqual(mockNotes[0])
      expect(state.isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      await useNotesStore.getState().fetchNote('nonexistent')

      const state = useNotesStore.getState()
      expect(state.selectedNote).toBeNull()
      expect(state.error).toBe('HTTP error! status: 404')
    })
  })

  describe('createNote', () => {
    it('should create note successfully', async () => {
      const newNote: Note = {
        ...mockNotes[0],
        id: 'new-id',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newNote,
      })

      const result = await useNotesStore.getState().createNote('New Note', '<p>Content</p>')

      expect(result).toEqual(newNote)
      expect(useNotesStore.getState().notes).toContainEqual(newNote)
      expect(useNotesStore.getState().selectedNote).toEqual(newNote)
    })

    it('should use default content if not provided', async () => {
      const newNote: Note = {
        ...mockNotes[0],
        id: 'new-id',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => newNote,
      })

      await useNotesStore.getState().createNote('New Note')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            title: 'New Note',
            content: '<p>新笔记内容...</p>',
          }),
        })
      )
    })

    it('should handle create error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      const result = await useNotesStore.getState().createNote('New Note')

      expect(result).toBeNull()
      expect(useNotesStore.getState().error).toBeDefined()
    })
  })

  describe('updateNote', () => {
    beforeEach(() => {
      useNotesStore.setState({ notes: mockNotes, selectedNote: mockNotes[0] })
    })

    it('should update note successfully', async () => {
      const updatedNote: Note = {
        ...mockNotes[0],
        title: 'Updated Title',
        updated_at: Date.now(),
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedNote,
      })

      const result = await useNotesStore.getState().updateNote('1', { title: 'Updated Title' })

      expect(result).toBe(true)
      expect(useNotesStore.getState().notes[0].title).toBe('Updated Title')
      expect(useNotesStore.getState().selectedNote?.title).toBe('Updated Title')
    })

    it('should update note in list but not selected if different', async () => {
      useNotesStore.setState({ selectedNote: mockNotes[1] })

      const updatedNote: Note = {
        ...mockNotes[0],
        title: 'Updated Title',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedNote,
      })

      await useNotesStore.getState().updateNote('1', { title: 'Updated Title' })

      expect(useNotesStore.getState().notes[0].title).toBe('Updated Title')
      expect(useNotesStore.getState().selectedNote?.title).toBe('Test Note 2')
    })

    it('should handle update error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      })

      const result = await useNotesStore.getState().updateNote('1', { title: 'Updated' })

      expect(result).toBe(false)
      expect(useNotesStore.getState().error).toBeDefined()
    })
  })

  describe('deleteNote', () => {
    beforeEach(() => {
      useNotesStore.setState({ notes: mockNotes, selectedNote: mockNotes[0] })
    })

    it('should delete note successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      const result = await useNotesStore.getState().deleteNote('1')

      expect(result).toBe(true)
      expect(useNotesStore.getState().notes).toHaveLength(1)
      expect(useNotesStore.getState().notes[0].id).toBe('2')
      expect(useNotesStore.getState().selectedNote).toBeNull()
    })

    it('should not clear selectedNote if deleting different note', async () => {
      useNotesStore.setState({ selectedNote: mockNotes[1] })

      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      await useNotesStore.getState().deleteNote('1')

      expect(useNotesStore.getState().selectedNote?.id).toBe('2')
    })

    it('should handle delete error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await useNotesStore.getState().deleteNote('1')

      expect(result).toBe(false)
      expect(useNotesStore.getState().error).toBeDefined()
    })
  })

  describe('setSelectedNote', () => {
    it('should set selected note', () => {
      useNotesStore.getState().setSelectedNote(mockNotes[0])

      expect(useNotesStore.getState().selectedNote).toEqual(mockNotes[0])
    })

    it('should clear selected note', () => {
      useNotesStore.setState({ selectedNote: mockNotes[0] })
      useNotesStore.getState().setSelectedNote(null)

      expect(useNotesStore.getState().selectedNote).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useNotesStore.setState({ error: 'Some error' })
      useNotesStore.getState().clearError()

      expect(useNotesStore.getState().error).toBeNull()
    })
  })

  describe('state updates', () => {
    it('should update lastSynced on successful operations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notes: mockNotes }),
      })

      const beforeSync = useNotesStore.getState().lastSynced
      await useNotesStore.getState().fetchNotes()
      const afterSync = useNotesStore.getState().lastSynced

      expect(afterSync).toBeGreaterThan(beforeSync || 0)
    })
  })
})
