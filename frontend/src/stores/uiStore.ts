import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // State
  theme: Theme;
  sidebarOpen: boolean;
  searchOpen: boolean;
  exportMenuOpen: boolean;
  isLoading: boolean;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    visible: boolean;
  } | null;

  // Actions - Theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Actions - UI
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  toggleExportMenu: () => void;
  setExportMenuOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;

  // Actions - Notifications
  showNotification: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    duration?: number
  ) => void;
  hideNotification: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial State
  theme: 'dark', // Default to dark theme
  sidebarOpen: true,
  searchOpen: false,
  exportMenuOpen: false,
  isLoading: false,
  notification: null,

  // Set theme
  setTheme: (theme: Theme) => {
    set({ theme });
    // Apply theme to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }
  },

  // Toggle theme
  toggleTheme: () => {
    const { theme } = get();
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },

  // Toggle sidebar
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  // Set sidebar open
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  // Toggle search
  toggleSearch: () => {
    set((state) => ({ searchOpen: !state.searchOpen }));
  },

  // Set search open
  setSearchOpen: (open: boolean) => {
    set({ searchOpen: open });
  },

  // Toggle export menu
  toggleExportMenu: () => {
    set((state) => ({ exportMenuOpen: !state.exportMenuOpen }));
  },

  // Set export menu open
  setExportMenuOpen: (open: boolean) => {
    set({ exportMenuOpen: open });
  },

  // Set loading
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Show notification
  showNotification: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    duration: number = 3000
  ) => {
    set({
      notification: {
        message,
        type,
        visible: true,
      },
    });

    // Auto-hide after duration
    setTimeout(() => {
      get().hideNotification();
    }, duration);
  },

  // Hide notification
  hideNotification: () => {
    set({ notification: null });
  },
}));

// Initialize theme on mount (client-side only)
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('pkms_theme') as Theme | null;
  if (storedTheme) {
    useUIStore.getState().setTheme(storedTheme);
  }

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (useUIStore.getState().theme === 'system') {
      useUIStore.getState().setTheme('system');
    }
  });
}

// Subscribe to theme changes and save to localStorage
useUIStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pkms_theme', state.theme);
  }
});
