import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import axe from 'axe-core';
import { ProfileMenu } from './ProfileMenu';
import { SidebarContent } from './SidebarContent';
import { data } from '../../lib/api';
import { setLanguage } from '../../lib/i18n';

vi.mock('../../lib/api', async (original) => {
  const actual = await original<typeof import('../../lib/api')>();
  return { ...actual, data: vi.fn() };
});
const user = {
  _id: 'angler',
  name: 'Piotr G',
  email: 'piotr@example.com',
  createdAt: '2026-10-01',
  avatar: {
    _id: 'avatar',
    provider: 'local' as const,
    fileId: 'angler/avatar.webp',
    url: '/media/avatar',
  },
};
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  clients.push(client);
  client.setQueryData(['session'], user);
  client.setQueryData(['lures'], [{ _id: 'private-lure' }]);
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <main>
                <ProfileMenu user={user} compact />
                <button>Outside</button>
              </main>
            }
          />
          <Route path="/profile" element={<h1>Account settings screen</h1>} />
          <Route path="/login" element={<h1>Sign in screen</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { client, ...view };
}
beforeEach(() => {
  setLanguage('en');
  vi.stubGlobal('PointerEvent', MouseEvent);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.mocked(data).mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  setLanguage('en');
});

it('shows the actual avatar/name and accessible account actions', async () => {
  const interaction = userEvent.setup();
  mount();
  const trigger = screen.getByRole('button', { name: 'Your profile, Piotr G' });
  expect(trigger.querySelector('img')).toHaveAttribute('src', '/media/avatar');
  expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await interaction.click(trigger);
  const menu = await screen.findByRole('menu', { name: 'Account menu' });
  expect(within(menu).getByText('Piotr G')).toBeVisible();
  expect(within(menu).getByRole('menuitem', { name: 'Account settings' })).toHaveAttribute(
    'href',
    '/profile',
  );
  expect(within(menu).getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
  expect(
    result.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});
it('supports arrow keys, Escape focus return, and outside dismissal', async () => {
  const interaction = userEvent.setup();
  mount();
  const trigger = screen.getByRole('button', { name: 'Your profile, Piotr G' });
  trigger.focus();
  await interaction.keyboard('{ArrowDown}');
  await waitFor(() =>
    expect(screen.getByRole('menuitem', { name: 'Account settings' })).toHaveFocus(),
  );
  await interaction.keyboard('{ArrowDown}');
  expect(screen.getByRole('menuitem', { name: 'Sign out' })).toHaveFocus();
  await interaction.keyboard('{Escape}');
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  await interaction.click(trigger);
  await screen.findByRole('menu');
  await interaction.click(screen.getByRole('button', { name: 'Outside' }));
  await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
});
it('opens account settings through the menu', async () => {
  const interaction = userEvent.setup();
  mount();
  await interaction.click(screen.getByRole('button', { name: 'Your profile, Piotr G' }));
  await interaction.click(await screen.findByRole('menuitem', { name: 'Account settings' }));
  expect(await screen.findByRole('heading', { name: 'Account settings screen' })).toBeVisible();
  expect(data).not.toHaveBeenCalled();
});
it('signs out through the API, clears personal cached data, and returns to login', async () => {
  const interaction = userEvent.setup();
  const { client } = mount();
  await interaction.click(screen.getByRole('button', { name: 'Your profile, Piotr G' }));
  await interaction.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
  expect(await screen.findByRole('heading', { name: 'Sign in screen' })).toBeVisible();
  expect(data).toHaveBeenCalledExactlyOnceWith('/auth/logout', { method: 'POST' });
  expect(client.getQueryData(['session'])).toBeNull();
  expect(client.getQueryData(['lures'])).toBeUndefined();
});
it('retains the session and allows retry when sign-out fails', async () => {
  const failure = vi.spyOn(toast, 'error');
  vi.mocked(data).mockRejectedValueOnce(new Error('Offline'));
  const interaction = userEvent.setup();
  const { client } = mount();
  await interaction.click(screen.getByRole('button', { name: 'Your profile, Piotr G' }));
  await interaction.click(await screen.findByRole('menuitem', { name: 'Sign out' }));
  await waitFor(() => expect(failure).toHaveBeenCalledWith('Offline'));
  expect(client.getQueryData(['session'])).toEqual(user);
  expect(client.getQueryData(['lures'])).toBeDefined();
  expect(screen.getByRole('menu')).toBeVisible();
  await interaction.click(screen.getByRole('menuitem', { name: 'Sign out' }));
  expect(await screen.findByRole('heading', { name: 'Sign in screen' })).toBeVisible();
});
it('keeps the sidebar focused on fishing actions', () => {
  render(
    <MemoryRouter>
      <SidebarContent />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Overview' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Lure collection' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Fishing journal' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Add a lure' })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Account settings' })).not.toBeInTheDocument();
  expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
  expect(screen.queryByText('Piotr G')).not.toBeInTheDocument();
});
