import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Stats } from '@lurelog/shared';
import Dashboard from './Dashboard';
import Forms from './Forms';
import { api, data } from '../lib/api';

vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: { name: 'Alex' } }) }));
vi.mock('../lib/api', async (original) => ({
  ...(await original<typeof import('../lib/api')>()),
  api: { stats: vi.fn(), lures: vi.fn(), lure: vi.fn() },
  data: vi.fn(),
}));
const empty: Stats = {
  totalLures: 0,
  totalCatches: 0,
  uniqueSpecies: 0,
  topLures: [],
  recentCatches: [],
  activity: [],
  species: [],
};
const lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Aglia',
  brand: 'Mepps',
  type: 'Spinner' as const,
  lengthMm: 45,
  catchCount: 0,
  createdAt: '2026-10-01',
};
const clients: QueryClient[] = [];
function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/catches/new" element={<Forms kind="catch" />} />
          <Route path="/lures/new" element={<Forms kind="lure" />} />
          <Route path="/lures/:id/catches/new" element={<Forms kind="catch" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.resetAllMocks();
});

it('replaces empty dashboard analytics with the first required step', async () => {
  vi.mocked(api.stats).mockResolvedValue(empty);
  mount('/dashboard');
  expect(await screen.findByRole('heading', { name: 'First, add a lure.' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Add your first lure' })).toHaveAttribute(
    'href',
    '/lures/new',
  );
  expect(screen.queryByRole('heading', { name: 'Catch activity' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Log your first catch' })).not.toBeInTheDocument();
});

it('advances the dashboard to logging after a lure exists', async () => {
  vi.mocked(api.stats).mockResolvedValue({ ...empty, totalLures: 1 });
  mount('/dashboard');
  expect(
    await screen.findByRole('heading', { name: 'Your lure is ready. Log your first catch.' }),
  ).toBeVisible();
  expect(screen.getByRole('link', { name: 'Log your first catch' })).toHaveAttribute(
    'href',
    '/catches/new',
  );
});

it('guides direct catch entry through adding a real lure and preselects it afterward', async () => {
  let exists = false;
  vi.mocked(api.lures).mockImplementation(async () => ({
    data: exists ? [lure] : [],
    total: exists ? 1 : 0,
    page: 1,
    pages: exists ? 1 : 0,
  }));
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(data).mockImplementation(async () => {
    exists = true;
    return lure;
  });
  const user = userEvent.setup();
  mount('/catches/new');
  await user.click(await screen.findByRole('link', { name: 'Add your first lure' }));
  await user.type(screen.getByLabelText(/Model \/ name/), 'Aglia');
  await user.type(screen.getByLabelText(/Brand/), 'Mepps');
  await user.type(screen.getByLabelText(/Length \(mm\)/), '45');
  await user.click(screen.getByRole('button', { name: 'Add to collection' }));
  expect(await screen.findByRole('heading', { name: 'Log a new catch' })).toBeVisible();
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: /Lure used/ })).toHaveValue('Mepps Aglia'),
  );
  expect(data).toHaveBeenCalledWith('/lures', expect.objectContaining({ method: 'POST' }));
  expect(screen.getByRole('button', { name: 'Save catch' })).toBeEnabled();
});

it('offers retry rather than assuming an unavailable collection is empty', async () => {
  vi.mocked(api.lures).mockRejectedValue(new Error('Connection interrupted'));
  mount('/catches/new');
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted');
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Add your first lure' })).not.toBeInTheDocument();
});
