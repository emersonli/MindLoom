import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VersionHistory } from './VersionHistory'

// Mock window.confirm
const originalConfirm = window.confirm

// Mock the API module
vi.mock('../utils/api', async () => {
  const actual = await vi.importActual('../utils/api')
  return {
    ...actual,
    versionsApi: {
      getVersions: vi.fn(),
      restoreVersion: vi.fn(),
    },
  }
})

// Import after mocks
import { versionsApi } from '../utils/api'

describe('VersionHistory', () => {
  const mockVersions = [
    {
      id: 'v1',
      note_id: 'note-1',
      title: 'Version 1',
      content: '<p>Content v1</p>',
      version_number: 1,
      created_at: Date.now() - 86400000,
      created_by: 'user-1',
    },
    {
      id: 'v2',
      note_id: 'note-1',
      title: 'Version 2',
      content: '<p>Content v2</p>',
      version_number: 2,
      created_at: Date.now(),
      created_by: 'user-1',
    },
  ]

  const defaultProps = {
    noteId: 'note-1',
    currentVersionNumber: 2,
    onRestore: vi.fn(),
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn().mockReturnValue(true)
    ;(versionsApi.getVersions as any).mockReset()
    ;(versionsApi.restoreVersion as any).mockReset()
  })

  afterAll(() => {
    window.confirm = originalConfirm
  })

  describe('rendering', () => {
    it('should render loading state initially', async () => {
      ;(versionsApi.getVersions as any).mockImplementation(() => new Promise(() => {}))
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('加载中...')).toBeInTheDocument()
    })

    it('should render versions list after loading', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('v1')).toBeInTheDocument()
      expect(screen.getByText('v2')).toBeInTheDocument()
    })

    it('should render error state on failure', async () => {
      ;(versionsApi.getVersions as any).mockRejectedValue(new Error('Failed'))
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText(/⚠️/)).toBeInTheDocument()
    })

    it('should render empty state when no versions', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: [] })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('暂无版本历史')).toBeInTheDocument()
    })

    it('should mark current version', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('当前版本')).toBeInTheDocument()
    })

    it('should render close button', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByLabelText('关闭版本历史')).toBeInTheDocument()
    })
  })

  describe('version selection', () => {
    it('should select version on click', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('v1')).toBeInTheDocument()
      fireEvent.click(screen.getByText('v1'))
      expect(screen.getByText('恢复此版本')).toBeInTheDocument()
    })

    it('should clear selection on cancel', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('v1')).toBeInTheDocument()
      fireEvent.click(screen.getByText('v1'))
      fireEvent.click(screen.getByText('取消'))
      expect(screen.queryByText('恢复此版本')).not.toBeInTheDocument()
    })
  })

  describe('version restore', () => {
    it('should call confirm before restore', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      ;(versionsApi.restoreVersion as any).mockResolvedValue({ data: { success: true } })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('v1')).toBeInTheDocument()
      fireEvent.click(screen.getByText('v1'))
      fireEvent.click(screen.getByText('恢复此版本'))
      expect(window.confirm).toHaveBeenCalled()
    })

    it('should restore version on confirmation', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      ;(versionsApi.restoreVersion as any).mockResolvedValue({ data: { success: true } })
      const onRestore = vi.fn()
      render(<VersionHistory {...defaultProps} onRestore={onRestore} />)
      expect(await screen.findByText('v1')).toBeInTheDocument()
      fireEvent.click(screen.getByText('v1'))
      fireEvent.click(screen.getByText('恢复此版本'))
      expect(versionsApi.restoreVersion).toHaveBeenCalledWith('v1', 'note-1')
      await vi.waitFor(() => {
        expect(onRestore).toHaveBeenCalled()
      })
    })

    it('should not restore on cancellation', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      window.confirm = vi.fn().mockReturnValue(false)
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByText('v1')).toBeInTheDocument()
      fireEvent.click(screen.getByText('v1'))
      fireEvent.click(screen.getByText('恢复此版本'))
      expect(versionsApi.restoreVersion).not.toHaveBeenCalled()
    })
  })

  describe('close functionality', () => {
    it('should call onClose when close button clicked', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      const onClose = vi.fn()
      render(<VersionHistory {...defaultProps} onClose={onClose} />)
      expect(await screen.findByLabelText('关闭版本历史')).toBeInTheDocument()
      fireEvent.click(screen.getByLabelText('关闭版本历史'))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have test IDs', async () => {
      ;(versionsApi.getVersions as any).mockResolvedValue({ data: mockVersions })
      render(<VersionHistory {...defaultProps} />)
      expect(await screen.findByTestId('version-history-panel')).toBeInTheDocument()
      expect(screen.getByTestId('versions-list')).toBeInTheDocument()
    })
  })
})
