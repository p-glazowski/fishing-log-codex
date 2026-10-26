import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initializeTheme } from '../../lib/theme';
import { AppearanceSettings } from './AppearanceSettings';

let dark = false;
let stop: () => void;
const listeners = new Set<() => void>();
function systemChanges(next: boolean) {
  act(() => {
    dark = next;
    listeners.forEach((listener) => listener());
  });
}
beforeEach(() => {
  localStorage.clear();
  dark = false;
  listeners.clear();
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return dark;
    },
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  }));
  stop = initializeTheme();
});
afterEach(() => {
  cleanup();
  stop();
  vi.unstubAllGlobals();
});
it('defaults to the system and follows live system changes', () => {
  render(<AppearanceSettings />);
  expect(screen.getByRole('radio', { name: /Use system settings/ })).toBeChecked();
  expect(document.documentElement).not.toHaveClass('dark');
  systemChanges(true);
  expect(document.documentElement).toHaveClass('dark');
  expect(screen.getByRole('status')).toHaveTextContent('Currently using dark mode');
  systemChanges(false);
  expect(document.documentElement).not.toHaveClass('dark');
});
it('saves an explicit preference and resumes automatic updates when system is selected', async () => {
  const user = userEvent.setup();
  render(<AppearanceSettings />);
  await user.click(screen.getByRole('radio', { name: 'Dark' }));
  expect(localStorage.getItem('lurelog-theme')).toBe('dark');
  systemChanges(false);
  expect(document.documentElement).toHaveClass('dark');
  await user.click(screen.getByRole('radio', { name: 'Light' }));
  systemChanges(true);
  expect(document.documentElement).not.toHaveClass('dark');
  expect(localStorage.getItem('lurelog-theme')).toBe('light');
  await user.click(screen.getByRole('radio', { name: /Use system settings/ }));
  expect(localStorage.getItem('lurelog-theme')).toBeNull();
  expect(document.documentElement).toHaveClass('dark');
  systemChanges(false);
  expect(document.documentElement).not.toHaveClass('dark');
});
it('restores saved preferences at startup and synchronizes changes from other tabs', () => {
  stop();
  localStorage.setItem('lurelog-theme', 'dark');
  stop = initializeTheme();
  render(<AppearanceSettings />);
  expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  expect(document.documentElement).toHaveClass('dark');
  act(() => {
    localStorage.setItem('lurelog-theme', 'light');
    window.dispatchEvent(new StorageEvent('storage', { key: 'lurelog-theme' }));
  });
  expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  expect(document.documentElement).not.toHaveClass('dark');
});
