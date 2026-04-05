import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Note } from '../types'

// Create mock index factory
function createMockIndex() {
  return {
    add: vi.fn(),
    remove: vi.fn(),
    search: vi.fn().mockReturnValue([]),
    clear: vi.fn(),
  }
}

// Mock FlexSearch module
vi.mock('flexsearch', () => ({
  default: {
    Index: vi.fn().mockImplementation(createMockIndex),
  },
}))

// Import after mocks
import { searchService } from './search'

describe('SearchService', () => {
  const mockNotes: Note[] = [
    {
      id: '1',
      title: 'Test Note 1',
      content: '<p>This is test content</p>',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: [],
    },
    {
      id: '2',
      title: 'Another Note',
      content: '<p>Different content here</p>',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: [],
    },
    {
      id: '3',
      title: 'JavaScript Guide',
      content: '<p>Learn about JavaScript programming</p>',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: ['programming', 'javascript'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the search service
    searchService['index'] = null
    searchService['notes'].clear()
  })

  describe('init', () => {
    it('should initialize index with notes', () => {
      searchService.init(mockNotes)

      expect(searchService['index']).toBeDefined()
      expect(searchService['notes'].size).toBe(3)
    })

    it('should index title and content', () => {
      searchService.init(mockNotes)

      const mockIndex = searchService['index'] as any
      expect(mockIndex.add).toHaveBeenCalledTimes(3)
      expect(mockIndex.add).toHaveBeenCalledWith('1', expect.stringContaining('Test Note 1'))
    })

    it('should clear existing notes before initializing', () => {
      searchService['notes'].set('old', {} as Note)
      searchService.init(mockNotes)

      expect(searchService['notes'].has('old')).toBe(false)
      expect(searchService['notes'].size).toBe(3)
    })
  })

  describe('addNote', () => {
    beforeEach(() => {
      searchService.init([])
    })

    it('should add note to index', () => {
      const newNote: Note = {
        id: '4',
        title: 'New Note',
        content: '<p>New content</p>',
        created_at: Date.now(),
        updated_at: Date.now(),
        tags: [],
      }

      searchService.addNote(newNote)

      expect(searchService['notes'].get('4')).toEqual(newNote)
      const mockIndex = searchService['index'] as any
      expect(mockIndex.add).toHaveBeenCalledWith('4', expect.any(String))
    })
  })

  describe('updateNote', () => {
    beforeEach(() => {
      searchService.init([])
      searchService['notes'].set('1', mockNotes[0])
    })

    it('should remove and re-add note', () => {
      const updatedNote: Note = {
        ...mockNotes[0],
        title: 'Updated Title',
        updated_at: Date.now(),
      }

      searchService.updateNote(updatedNote)

      const mockIndex = searchService['index'] as any
      expect(mockIndex.remove).toHaveBeenCalledWith('1')
      expect(mockIndex.add).toHaveBeenCalledWith('1', expect.any(String))
      expect(searchService['notes'].get('1')?.title).toBe('Updated Title')
    })
  })

  describe('removeNote', () => {
    beforeEach(() => {
      searchService.init([])
      searchService['notes'].set('1', mockNotes[0])
    })

    it('should remove note from index and map', () => {
      searchService.removeNote('1')

      expect(searchService['notes'].has('1')).toBe(false)
      const mockIndex = searchService['index'] as any
      expect(mockIndex.remove).toHaveBeenCalledWith('1')
    })
  })

  describe('search', () => {
    beforeEach(() => {
      searchService.init([])
      const mockIndex = searchService['index'] as any
      mockIndex.search.mockReturnValue(['1', '2'])
      mockNotes.forEach(note => searchService['notes'].set(note.id, note))
    })

    it('should return empty array for empty query', () => {
      const results = searchService.search('')
      expect(results).toEqual([])
    })

    it('should return empty array without index', () => {
      searchService['index'] = null
      const results = searchService.search('test')
      expect(results).toEqual([])
    })

    it('should search and return matching notes', () => {
      const results = searchService.search('test')

      const mockIndex = searchService['index'] as any
      expect(mockIndex.search).toHaveBeenCalledWith('test', 20)
      expect(results.length).toBe(2)
      expect(results[0].id).toBe('1')
      expect(results[1].id).toBe('2')
    })

    it('should respect limit parameter', () => {
      searchService.search('test', 5)
      const mockIndex = searchService['index'] as any
      expect(mockIndex.search).toHaveBeenCalledWith('test', 5)
    })

    it('should filter out notes not in map', () => {
      const mockIndex = searchService['index'] as any
      mockIndex.search.mockReturnValue(['1', '999'])

      const results = searchService.search('test')
      expect(results.length).toBe(1)
      expect(results[0].id).toBe('1')
    })
  })

  describe('searchWithHighlights', () => {
    beforeEach(() => {
      searchService.init([])
      const mockIndex = searchService['index'] as any
      mockIndex.search.mockReturnValue(['1'])
      mockNotes.forEach(note => searchService['notes'].set(note.id, note))
    })

    it('should return notes with highlights', () => {
      const results = searchService.searchWithHighlights('test')

      expect(results.length).toBe(1)
      expect(results[0]).toHaveProperty('note')
      expect(results[0]).toHaveProperty('highlights')
      expect(Array.isArray(results[0].highlights)).toBe(true)
    })

    it('should generate highlight snippets', () => {
      const results = searchService.searchWithHighlights('content')

      expect(results[0].highlights.length).toBeGreaterThan(0)
      expect(results[0].highlights[0]).toContain('<mark>')
    })
  })

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      const html = '<p>Hello <strong>World</strong></p>'
      const result = (searchService as any).stripHtml(html)
      expect(result).toBe('Hello World')
    })

    it('should normalize whitespace', () => {
      const html = '<p>Multiple   spaces</p>'
      const result = (searchService as any).stripHtml(html)
      expect(result).toBe('Multiple spaces')
    })

    it('should handle empty string', () => {
      const result = (searchService as any).stripHtml('')
      expect(result).toBe('')
    })
  })

  describe('getSuggestions', () => {
    beforeEach(() => {
      searchService.init([])
      const mockIndex = searchService['index'] as any
      mockIndex.search.mockReturnValue([{ id: '1' }, { id: '3' }])
      mockNotes.forEach(note => searchService['notes'].set(note.id, note))
    })

    it('should return empty array for short query', () => {
      const suggestions = searchService.getSuggestions('t')
      expect(suggestions).toEqual([])
    })

    it('should return empty array without index', () => {
      searchService['index'] = null
      const suggestions = searchService.getSuggestions('test')
      expect(suggestions).toEqual([])
    })

    it('should return title suggestions', () => {
      const suggestions = searchService.getSuggestions('test')
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })
  })
})
