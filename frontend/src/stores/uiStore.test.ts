import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage before importing the store
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => (localStorageMock as any).store[key] || null),
  setItem: vi.fn((key: string, value: string) => { (localStorageMock as any).store[key] = value }),
  removeItem: vi.fn((key: string) => { delete (localStorageMock as any).store[key] }),
  clear: vi.fn(() => { (localStorageMock as any).store = {} }),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock matchMedia
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock document
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
  contains: vi.fn(),
  toggle: vi.fn(),
}

Object.defineProperty(global, 'document', {
  value: {
    documentElement: {
      classList: mockClassList,
    },
  },
  writable: true,
})

// Now import the store after mocks are set up
import { useUIStore } from './uiStore'

describe('useUIStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.store = {}
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    mockClassList.add.mockClear()
    mockClassList.remove.mockClear()

    // Reset store to initial state
    useUIStore.setState({
      theme: 'dark',
      sidebarOpen: true,
      searchOpen: false,
      exportMenuOpen: false,
      isLoading: false,
      notification: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useUIStore.getState()

      expect(state.theme).toBe('dark')
      expect(state.sidebarOpen).toBe(true)
      expect(state.searchOpen).toBe(false)
      expect(state.exportMenuOpen).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.notification).toBeNull()
    })
  })

  describe('theme management', () => {
    it('should set theme to dark', () => {
      useUIStore.getState().setTheme('dark')

      expect(useUIStore.getState().theme).toBe('dark')
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should set theme to light', () => {
      useUIStore.getState().setTheme('light')

      expect(useUIStore.getState().theme).toBe('light')
      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should toggle theme from dark to light', () => {
      useUIStore.getState().toggleTheme()

      expect(useUIStore.getState().theme).toBe('light')
    })

    it('should toggle theme from light to dark', () => {
      useUIStore.setState({ theme: 'light' })
      useUIStore.getState().toggleTheme()

      expect(useUIStore.getState().theme).toBe('dark')
    })

    it('should save theme to localStorage', () => {
      useUIStore.getState().setTheme('light')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('pkms_theme', 'light')
    })
  })

  describe('sidebar management', () => {
    it('should toggle sidebar', () => {
      useUIStore.getState().toggleSidebar()

      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('should toggle sidebar back to open', () => {
      useUIStore.setState({ sidebarOpen: false })
      useUIStore.getState().toggleSidebar()

      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it('should set sidebar open explicitly', () => {
      useUIStore.getState().setSidebarOpen(false)

      expect(useUIStore.getState().sidebarOpen).toBe(false)
    })

    it('should set sidebar open to true', () => {
      useUIStore.setState({ sidebarOpen: false })
      useUIStore.getState().setSidebarOpen(true)

      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })
  })

  describe('search management', () => {
    it('should toggle search', () => {
      useUIStore.getState().toggleSearch()

      expect(useUIStore.getState().searchOpen).toBe(true)
    })

    it('should toggle search back to closed', () => {
      useUIStore.setState({ searchOpen: true })
      useUIStore.getState().toggleSearch()

      expect(useUIStore.getState().searchOpen).toBe(false)
    })

    it('should set search open explicitly', () => {
      useUIStore.getState().setSearchOpen(true)

      expect(useUIStore.getState().searchOpen).toBe(true)
    })
  })

  describe('export menu management', () => {
    it('should toggle export menu', () => {
      useUIStore.getState().toggleExportMenu()

      expect(useUIStore.getState().exportMenuOpen).toBe(true)
    })

    it('should toggle export menu back to closed', () => {
      useUIStore.setState({ exportMenuOpen: true })
      useUIStore.getState().toggleExportMenu()

      expect(useUIStore.getState().exportMenuOpen).toBe(false)
    })

    it('should set export menu open explicitly', () => {
      useUIStore.getState().setExportMenuOpen(true)

      expect(useUIStore.getState().exportMenuOpen).toBe(true)
    })
  })

  describe('loading state', () => {
    it('should set loading to true', () => {
      useUIStore.getState().setLoading(true)

      expect(useUIStore.getState().isLoading).toBe(true)
    })

    it('should set loading to false', () => {
      useUIStore.setState({ isLoading: true })
      useUIStore.getState().setLoading(false)

      expect(useUIStore.getState().isLoading).toBe(false)
    })
  })

  describe('notifications', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should show notification', () => {
      useUIStore.getState().showNotification('Test message')

      expect(useUIStore.getState().notification).toEqual({
        message: 'Test message',
        type: 'info',
        visible: true,
      })
    })

    it('should show success notification', () => {
      useUIStore.getState().showNotification('Success!', 'success')

      expect(useUIStore.getState().notification).toEqual({
        message: 'Success!',
        type: 'success',
        visible: true,
      })
    })

    it('should show error notification', () => {
      useUIStore.getState().showNotification('Error!', 'error')

      expect(useUIStore.getState().notification).toEqual({
        message: 'Error!',
        type: 'error',
        visible: true,
      })
    })

    it('should show warning notification', () => {
      useUIStore.getState().showNotification('Warning!', 'warning')

      expect(useUIStore.getState().notification).toEqual({
        message: 'Warning!',
        type: 'warning',
        visible: true,
      })
    })

    it('should hide notification', () => {
      useUIStore.setState({
        notification: {
          message: 'Test',
          type: 'info',
          visible: true,
        },
      })
      useUIStore.getState().hideNotification()

      expect(useUIStore.getState().notification).toBeNull()
    })

    it('should auto-hide notification after duration', () => {
      useUIStore.getState().showNotification('Test', 'info', 1000)

      expect(useUIStore.getState().notification).toBeDefined()

      vi.advanceTimersByTime(1000)

      expect(useUIStore.getState().notification).toBeNull()
    })

    it('should use default duration of 3000ms', () => {
      useUIStore.getState().showNotification('Test')

      vi.advanceTimersByTime(2999)
      expect(useUIStore.getState().notification).toBeDefined()

      vi.advanceTimersByTime(1)
      expect(useUIStore.getState().notification).toBeNull()
    })
  })

  describe('state subscriptions', () => {
    it('should save theme changes to localStorage', () => {
      useUIStore.getState().setTheme('light')

      expect(localStorageMock.setItem).toHaveBeenCalledWith('pkms_theme', 'light')
    })
  })

  describe('multiple state updates', () => {
    it('should handle multiple UI state changes', () => {
      const state = useUIStore.getState()
      
      state.toggleSidebar()
      state.toggleSearch()
      state.setLoading(true)

      const newState = useUIStore.getState()
      expect(newState.sidebarOpen).toBe(false)
      expect(newState.searchOpen).toBe(true)
      expect(newState.isLoading).toBe(true)
    })
  })
})
