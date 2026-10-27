import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axe from 'axe-core';
import Landing from './Landing';
import { useAuth } from '../lib/auth';
import { setLanguage } from '../lib/i18n';
vi.mock('../lib/auth', () => ({ useAuth: vi.fn() }));
const user = {
  _id: 'user',
  name: 'Alex Fisher',
  email: 'alex@example.com',
  createdAt: '2026-10-01',
  avatar: {
    _id: 'avatar',
    provider: 'local' as const,
    fileId: 'user/avatar.webp',
    url: '/media/avatar',
  },
};
const refresh = vi.fn().mockResolvedValue(undefined);
function mount() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/profile" element={<h1>Your account</h1>} />
        <Route path="/dashboard" element={<h1>Your fishing log</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, error: null, refresh });
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  setLanguage('en');
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
describe('session-aware landing page', () => {
  it('offers sign-in and registration to guests', () => {
    mount();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Start your log' })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.queryByRole('link', { name: /Your profile/ })).not.toBeInTheDocument();
  });
  it('shows the actual profile and workspace for signed-in visitors across all CTAs', async () => {
    vi.mocked(useAuth).mockReturnValue({ user, loading: false, error: null, refresh });
    const interaction = userEvent.setup();
    mount();
    expect(screen.queryByRole('link', { name: /Your profile/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Your fishing log' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(document.querySelector('a[href="/login"],a[href="/register"]')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open your fishing log' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await interaction.click(screen.getByRole('link', { name: 'Your fishing log' }));
    expect(screen.getByRole('heading', { name: 'Your fishing log' })).toBeVisible();
  });
  it('offers language selection in the header', async () => {
    const interaction = userEvent.setup();
    mount();
    const header = screen.getByRole('banner');
    const language = within(header).getByLabelText('Language preference');
    await interaction.selectOptions(language, 'pl');
    expect(document.documentElement.lang).toBe('pl');
    expect(within(header).getByLabelText('Preferowany język')).toHaveValue('pl');
  });
  it('does not flash sign-in or registration while checking a session', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: true, error: null, refresh });
    mount();
    expect(screen.getByRole('status', { name: 'Checking your session' })).toBeVisible();
    expect(document.querySelector('a[href="/login"],a[href="/register"]')).not.toBeInTheDocument();
  });
  it('lets a visitor retry a failed session without treating them as signed out', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      error: new Error('Offline'),
      refresh,
    });
    const interaction = userEvent.setup();
    mount();
    await interaction.click(screen.getByRole('button', { name: 'Retry session' }));
    expect(refresh).toHaveBeenCalledOnce();
    expect(document.querySelector('a[href="/login"],a[href="/register"]')).not.toBeInTheDocument();
  });
  it('provides keyboard navigation without header appearance controls', async () => {
    const interaction = userEvent.setup();
    mount();
    await interaction.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
    await interaction.tab();
    expect(screen.getAllByRole('link', { name: 'LureLog home' })[0]).toHaveFocus();
    expect(screen.queryByRole('button', { name: /appearance/i })).not.toBeInTheDocument();
  });
  it.each([false, true])(
    'has no axe structural accessibility violations (signed in: %s)',
    async (signedIn) => {
      vi.mocked(useAuth).mockReturnValue({
        user: signedIn ? user : null,
        loading: false,
        error: null,
        refresh,
      });
      const { container } = mount();
      const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
      expect(
        result.violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
    },
  );
});
