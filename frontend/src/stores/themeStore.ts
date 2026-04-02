import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Apply theme to document
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.remove('light-theme');
    root.classList.add('dark-theme');
  } else {
    root.classList.remove('dark-theme');
    root.classList.add('light-theme');
  }
}

// Initialize theme on load
function initializeTheme(): Theme {
  const stored = localStorage.getItem('mindloom-theme');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed === 'dark' || parsed === 'light') {
        applyTheme(parsed);
        return parsed;
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
    return 'light';
  }
  
  // Default to dark
  applyTheme('dark');
  return 'dark';
}

const initialTheme = initializeTheme();

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: initialTheme,
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          applyTheme(newTheme);
          return { theme: newTheme };
        }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'mindloom-theme',
    }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const currentTheme = useThemeStore.getState().theme;
    // Only auto-switch if user hasn't explicitly set a preference
    const stored = localStorage.getItem('mindloom-theme');
    if (!stored) {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
      useThemeStore.setState({ theme: newTheme });
    }
  });
}
