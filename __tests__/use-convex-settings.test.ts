import { renderHook } from '@testing-library/react'
import { useConvexSettings } from '../lib/hooks/use-convex-settings'
import { UserSettings } from '../lib/types'

// Mock Convex hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}))

jest.mock('../convex/_generated/api', () => ({
  api: {
    settings: {
      getSettings: 'getSettings',
      updateSettings: 'updateSettings',
    },
  },
}))

describe('useConvexSettings', () => {
  const mockUpdateSettings = jest.fn()
  const mockConvexSettings = {
    per_page: 20,
    per_channel: 10,
    showThumbnails: true,
    showDescriptions: true,
    defaultFeedType: 'all' as const,
    sortOrder: 'newest' as const,
    caching_ttl: 0,
    concurrency: 6,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset localStorage
    localStorage.clear()
    
    // Mock Convex hooks
    const { useQuery, useMutation } = require('convex/react')
    useQuery.mockReturnValue(mockConvexSettings)
    useMutation.mockReturnValue(mockUpdateSettings)
  })

  it('initializes with default settings when no Convex settings', () => {
    const { useQuery } = require('convex/react')
    useQuery.mockReturnValue(null)

    const { result } = renderHook(() => useConvexSettings())

    expect(result.current.settings).toEqual({
      per_page: 20,
      per_channel: 10,
      showThumbnails: true,
      showDescriptions: true,
      defaultFeedType: 'all',
      sortOrder: 'newest',
      caching_ttl: 0,
      concurrency: 6,
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('loads settings from Convex when available', () => {
    const { result } = renderHook(() => useConvexSettings())

    expect(result.current.settings).toEqual(mockConvexSettings)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('updates settings successfully', async () => {
    mockUpdateSettings.mockResolvedValue({})

    const { result } = renderHook(() => useConvexSettings())
    
    const newSettings: Partial<UserSettings> = {
      per_page: 30,
      showThumbnails: false,
    }

    await result.current.updateSettings(newSettings)

    expect(mockUpdateSettings).toHaveBeenCalledWith(newSettings)
    expect(result.current.settings).toEqual({
      ...mockConvexSettings,
      ...newSettings,
    })
    
    // Check localStorage was updated
    const savedSettings = localStorage.getItem('user-settings')
    expect(savedSettings).toBe(JSON.stringify({
      ...mockConvexSettings,
      ...newSettings,
    }))
  })

  it('handles update settings error', async () => {
    const errorMessage = 'Failed to update settings'
    mockUpdateSettings.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useConvexSettings())
    
    const newSettings: Partial<UserSettings> = {
      per_page: 30,
    }

    let error: Error | null = null
    try {
      await result.current.updateSettings(newSettings)
    } catch (err) {
      error = err as Error
    }

    expect(error).toBeTruthy()
    expect(error?.message).toBe(errorMessage)
    expect(result.current.error).toBe(errorMessage)
  })

  it('sets loading state during update', async () => {
    mockUpdateSettings.mockImplementation(() => new Promise(resolve => {
      setTimeout(resolve, 100)
    }))

    const { result } = renderHook(() => useConvexSettings())
    
    const updatePromise = result.current.updateSettings({ per_page: 30 })
    
    expect(result.current.loading).toBe(true)
    
    await updatePromise
    expect(result.current.loading).toBe(false)
  })

  it('refreshes settings', async () => {
    const { result } = renderHook(() => useConvexSettings())
    
    await result.current.refreshSettings()

    // Should not throw error and should maintain current settings
    expect(result.current.settings).toEqual(mockConvexSettings)
  })

  it('handles refresh settings error', async () => {
    const { useQuery } = require('convex/react')
    useQuery.mockImplementation(() => {
      throw new Error('Failed to fetch settings')
    })

    const { result } = renderHook(() => useConvexSettings())
    
    await result.current.refreshSettings()

    expect(result.current.error).toBe('Failed to fetch settings')
  })

  it('updates local state immediately for responsive UI', async () => {
    mockUpdateSettings.mockResolvedValue({})

    const { result } = renderHook(() => useConvexSettings())
    
    const newSettings: Partial<UserSettings> = {
      per_page: 30,
    }

    // State should update immediately, before the async operation completes
    result.current.updateSettings(newSettings)

    expect(result.current.settings.per_page).toBe(30)
  })

  it('merges settings correctly', async () => {
    mockUpdateSettings.mockResolvedValue({})

    const { result } = renderHook(() => useConvexSettings())
    
    const newSettings: Partial<UserSettings> = {
      per_page: 30,
      showThumbnails: false,
    }

    await result.current.updateSettings(newSettings)

    expect(result.current.settings).toEqual({
      per_page: 30,
      per_channel: 10, // unchanged
      showThumbnails: false,
      showDescriptions: true, // unchanged
      defaultFeedType: 'all', // unchanged
      sortOrder: 'newest', // unchanged
      caching_ttl: 0, // unchanged
      concurrency: 6, // unchanged
    })
  })

  it('falls back to localStorage when Convex is not available', () => {
    const { useQuery } = require('convex/react')
    useQuery.mockReturnValue(null)

    // Set localStorage with custom settings
    const localStorageSettings = {
      per_page: 15,
      showThumbnails: false,
    }
    localStorage.setItem('user-settings', JSON.stringify(localStorageSettings))

    const { result } = renderHook(() => useConvexSettings())

    expect(result.current.settings).toEqual({
      per_page: 15,
      per_channel: 10, // default
      showThumbnails: false,
      showDescriptions: true, // default
      defaultFeedType: 'all', // default
      sortOrder: 'newest', // default
      caching_ttl: 0, // default
      concurrency: 6, // default
    })
  })

  it('handles malformed localStorage gracefully', () => {
    const { useQuery } = require('convex/react')
    useQuery.mockReturnValue(null)

    localStorage.setItem('user-settings', 'invalid-json')

    const { result } = renderHook(() => useConvexSettings())

    // Should fall back to defaults
    expect(result.current.settings).toEqual({
      per_page: 20,
      per_channel: 10,
      showThumbnails: true,
      showDescriptions: true,
      defaultFeedType: 'all',
      sortOrder: 'newest',
      caching_ttl: 0,
      concurrency: 6,
    })
  })

  it('reacts to Convex settings changes', async () => {
    const { useQuery } = require('convex/react')
    let mockSettings = mockConvexSettings
    useQuery.mockReturnValue(mockSettings)

    const { result, rerender } = renderHook(() => useConvexSettings())

    expect(result.current.settings).toEqual(mockSettings)

    // Simulate Convex settings update
    mockSettings = {
      ...mockSettings,
      per_page: 50,
      showThumbnails: false,
    }
    useQuery.mockReturnValue(mockSettings)

    rerender()

    expect(result.current.settings).toEqual(mockSettings)
  })
})