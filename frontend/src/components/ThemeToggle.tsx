import React from 'react';
import { useThemeStore } from '../stores/themeStore';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-button"
      data-testid="theme-toggle-button"
      title={`切换到${theme === 'dark' ? '明亮' : '暗色'}主题`}
      aria-label={`切换到${theme === 'dark' ? '明亮' : '暗色'}主题`}
    >
      {theme === 'dark' ? (
        <span data-testid="theme-icon-dark" className="text-xl">🌙</span>
      ) : (
        <span data-testid="theme-icon-light" className="text-xl">☀️</span>
      )}
    </button>
  );
};
