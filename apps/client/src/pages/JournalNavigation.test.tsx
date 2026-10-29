import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Journal from './Journal';
import { CatchDetails } from './details/CatchDetails';
import { api } from '../lib/api';
vi.mock('../lib/api', async (original) => ({
  ...(await original<typeof import('../lib/api')>()),
  api: { catches: vi.fn(), catch: vi.fn(), lure: vi.fn(), lures: vi.fn() },
}));
const lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Aglia',
  brand: 'Mepps',
  type: 'Spinner' as const,
  lengthMm: 45,
  catchCount: 1,
  createdAt: '2026-10-01',
};
const fish = {
  _id: 'fish',
  lureId: lure,
  species: 'Trout',
  caughtAt: '2026-10-29T08:00:00Z',
  createdAt: '2026-10-29',
};
const clients: QueryClient[] = [];
function mount(path = '/catches') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/catches" element={<Journal />} />
          <Route path="/catches/:id" element={<CatchDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.mocked(api.catches).mockImplementation(async (query) => {
    const found = new URLSearchParams(query).get('search') !== 'Pike';
    return { data: found ? [fish] : [], total: found ? 1 : 0, page: 1, pages: found ? 1 : 0 };
  });
  vi.mocked(api.catch).mockResolvedValue(fish);
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.resetAllMocks();
});
it('keeps species and dates after opening a catch and returning through its Back link', async () => {
  const user = userEvent.setup();
  mount('/catches?search=Trout&from=2026-10-01&to=2026-10-31&sort=length');
  await user.click(await screen.findByRole('link', { name: 'Trout' }));
  const back = await screen.findByRole('link', { name: 'Back to journal' });
  expect(back).toHaveAttribute(
    'href',
    '/catches?search=Trout&from=2026-10-01&to=2026-10-31&sort=length',
  );
  await user.click(back);
  expect(screen.getByRole('textbox', { name: 'Search fish species' })).toHaveValue('Trout');
  expect(screen.getByRole('button', { name: 'Clear date filter' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: /Filters/ }));
  expect(screen.getByLabelText('From date')).toHaveValue('2026-10-01');
  expect(screen.getByRole('combobox', { name: 'Sort catches' })).toHaveValue('length');
});
it('recovers an empty search by clearing filters instead of offering a first catch', async () => {
  const user = userEvent.setup();
  mount('/catches?search=Pike');
  expect(
    await screen.findByRole('heading', { name: 'No catches match your filters.' }),
  ).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Log your first catch' })).not.toBeInTheDocument();
  await user.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!);
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Search fish species' })).toHaveValue(''),
  );
  expect(await screen.findByRole('link', { name: 'Trout' })).toBeVisible();
});
