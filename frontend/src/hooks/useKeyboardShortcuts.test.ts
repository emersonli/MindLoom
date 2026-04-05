import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts, defaultShortcuts, getModifierDisplay, formatShortcut, type ShortcutConfig } from './useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should register and unregister keyboard shortcuts', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['ctrl'],
        handler: vi.fn(),
        description: 'Save',
      },
    ]

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts))

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('should trigger handler when shortcut is pressed', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['ctrl'],
        handler,
        description: 'Save',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      })
      window.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalled()
  })

  it('should not trigger handler when wrong key is pressed', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['ctrl'],
        handler,
        description: 'Save',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
      })
      window.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should not trigger handler when modifier is missing', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['ctrl'],
        handler,
        description: 'Save',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: false,
      })
      window.dispatchEvent(event)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should prevent default for non-input contexts', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['ctrl'],
        handler,
        description: 'Save',
        category: 'global',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    const preventDefaultSpy = vi.fn()
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      })
      Object.defineProperty(event, 'target', {
        value: { tagName: 'DIV' },
        writable: true,
      })
      Object.defineProperty(event, 'preventDefault', {
        value: preventDefaultSpy,
        writable: true,
      })
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should not prevent default for editor shortcuts in input', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 'b',
        modifiers: ['ctrl'],
        handler,
        description: 'Bold',
        category: 'editor',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    const preventDefaultSpy = vi.fn()
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true,
      })
      Object.defineProperty(event, 'target', {
        value: { tagName: 'INPUT' },
        writable: true,
      })
      Object.defineProperty(event, 'preventDefault', {
        value: preventDefaultSpy,
        writable: true,
      })
      window.dispatchEvent(event)
    })

    expect(preventDefaultSpy).not.toHaveBeenCalled()
  })

  it('should handle multiple modifiers', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['ctrl', 'shift'],
        handler,
        description: 'Save As',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        shiftKey: true,
      })
      window.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalled()
  })

  it('should handle meta key for Mac', () => {
    const handler = vi.fn()
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        modifiers: ['meta'],
        handler,
        description: 'Save',
      },
    ]

    renderHook(() => useKeyboardShortcuts(shortcuts))

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      })
      window.dispatchEvent(event)
    })

    expect(handler).toHaveBeenCalled()
  })
})

describe('getModifierDisplay', () => {
  it('should return empty string for no modifiers', () => {
    expect(getModifierDisplay()).toBe('')
    expect(getModifierDisplay([])).toBe('')
  })

  it('should display ctrl as Ctrl', () => {
    expect(getModifierDisplay(['ctrl'])).toBe('Ctrl')
  })

  it('should display meta as Cmd', () => {
    expect(getModifierDisplay(['meta'])).toBe('Cmd')
  })

  it('should display multiple modifiers', () => {
    expect(getModifierDisplay(['ctrl', 'shift'])).toBe('Ctrl + Shift')
    expect(getModifierDisplay(['ctrl', 'meta', 'shift'])).toBe('Ctrl + Cmd + Shift')
  })

  it('should handle all modifier types', () => {
    expect(getModifierDisplay(['ctrl', 'meta', 'shift', 'alt'])).toBe('Ctrl + Cmd + Shift + Alt')
  })
})

describe('formatShortcut', () => {
  it('should format shortcut with modifiers', () => {
    const shortcut: ShortcutConfig = {
      key: 's',
      modifiers: ['ctrl'],
      handler: () => {},
      description: 'Save',
    }
    expect(formatShortcut(shortcut)).toBe('Ctrl + S')
  })

  it('should format shortcut with multiple modifiers', () => {
    const shortcut: ShortcutConfig = {
      key: 's',
      modifiers: ['ctrl', 'shift'],
      handler: () => {},
      description: 'Save As',
    }
    expect(formatShortcut(shortcut)).toBe('Ctrl + Shift + S')
  })

  it('should format shortcut without modifiers', () => {
    const shortcut: ShortcutConfig = {
      key: 'enter',
      handler: () => {},
      description: 'Confirm',
    }
    expect(formatShortcut(shortcut)).toBe('ENTER')
  })

  it('should handle meta key', () => {
    const shortcut: ShortcutConfig = {
      key: 's',
      modifiers: ['meta'],
      handler: () => {},
      description: 'Save',
    }
    expect(formatShortcut(shortcut)).toBe('Cmd + S')
  })
})

describe('defaultShortcuts', () => {
  it('should have correct structure', () => {
    expect(defaultShortcuts).toBeInstanceOf(Array)
    expect(defaultShortcuts.length).toBeGreaterThan(0)

    defaultShortcuts.forEach(shortcut => {
      expect(shortcut).toHaveProperty('key')
      expect(shortcut).toHaveProperty('handler')
      expect(shortcut).toHaveProperty('description')
      expect(['global', 'editor', 'navigation']).toContain(shortcut.category)
    })
  })

  it('should include common shortcuts', () => {
    const keys = defaultShortcuts.map(s => s.key)
    expect(keys).toContain('s') // Save
    expect(keys).toContain('n') // New note
    expect(keys).toContain('f') // Search
  })
})
