import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axe from 'axe-core';
import Collection from './Collection';
import Journal from './Journal';
import Forms from './Forms';
import Details from './Details';
import Profile from './Profile';
import Auth from './Auth';
import { useAuth } from '../lib/auth';
import { api, data } from '../lib/api';
vi.mock('../lib/auth', () => ({ useAuth: vi.fn() }));
vi.mock('../lib/api', async (original) => {
  const actual = await original<typeof import('../lib/api')>();
  return {
    ...actual,
    api: { ...actual.api, lures: vi.fn(), lure: vi.fn(), catches: vi.fn(), catch: vi.fn() },
    data: vi.fn(),
  };
});
const lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Original Floater',
  brand: 'Rapala',
  type: 'Minnow' as const,
  lengthMm: 90,
  catchCount: 1,
  createdAt: '2026-10-01',
};
const fish = {
  _id: '507f1f77bcf86cd799439012',
  species: 'Northern Pike',
  lureId: lure,
  caughtAt: '2026-10-01T08:00:00Z',
  createdAt: '2026-10-01',
};
beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    user: { _id: 'user', name: 'Alex Fisher', email: 'alex@example.com', createdAt: '2026-10-01' },
    loading: false,
    error: null,
    refresh: async () => {},
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
  vi.mocked(api.catches).mockResolvedValue({ data: [fish], total: 1, page: 1, pages: 1 });
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(api.catch).mockResolvedValue(fish);
  vi.mocked(data).mockResolvedValue(['Rapala']);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
const pages = [
  { path: '/login', route: '/login', title: 'Welcome back, angler.', element: <Auth /> },
  {
    path: '/register',
    route: '/register',
    title: 'Start your fishing story.',
    element: <Auth register />,
  },
  { path: '/lures', route: '/lures', title: 'Your lure collection', element: <Collection /> },
  { path: '/catches', route: '/catches', title: 'Your fishing journal', element: <Journal /> },
  {
    path: '/lures/new',
    route: '/lures/new',
    title: 'Add a new lure',
    element: <Forms kind="lure" />,
  },
  {
    path: '/catches/new',
    route: '/catches/new',
    title: 'Log a new catch',
    element: <Forms kind="catch" />,
  },
  {
    path: `/lures/${lure._id}`,
    route: '/lures/:id',
    title: 'Original Floater',
    element: <Details kind="lure" />,
  },
  {
    path: `/catches/${fish._id}`,
    route: '/catches/:id',
    title: 'Northern Pike',
    element: <Details kind="catch" />,
  },
  { path: '/profile', route: '/profile', title: 'Account settings', element: <Profile /> },
];
describe('workspace accessibility structure', () => {
  it.each(pages)('$title has labeled controls and a valid heading structure', async (page) => {
    if (page.path === '/login' || page.path === '/register')
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
        refresh: async () => {},
      });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[page.path]}>
          <Routes>
            <Route path={page.route} element={<main>{page.element}</main>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByRole('heading', { name: page.title });
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    await waitFor(() => expect(client.isFetching()).toBe(0));
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });
});
