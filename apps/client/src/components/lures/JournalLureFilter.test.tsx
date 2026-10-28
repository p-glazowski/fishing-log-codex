import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axe from 'axe-core';
import Journal from '../../pages/Journal';
import { api } from '../../lib/api';
import { setLanguage } from '../../lib/i18n';
vi.mock('../../lib/api', async (original) => {
  const actual = await original<typeof import('../../lib/api')>();
  return { ...actual, api: { ...actual.api, lures: vi.fn(), lure: vi.fn(), catches: vi.fn() } };
});
const small = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Jerk Buster II',
  brand: 'Savage Gear',
  type: 'Hard Bait' as const,
  lengthMm: 90,
  catchCount: 0,
  color: 'Perch',
  createdAt: '2026-10-01',
};
const large = {
  ...small,
  _id: '507f1f77bcf86cd799439012',
  brand: 'savage gear',
  lengthMm: 150,
  color: 'Firetiger',
};
const clients: QueryClient[] = [];
function mount(path = '/catches') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Journal />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  setLanguage('en');
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.mocked(api.lures).mockResolvedValue({ data: [small, large], total: 2, page: 1, pages: 1 });
  vi.mocked(api.lure).mockImplementation(async (id) => (id === large._id ? large : small));
  vi.mocked(api.catches).mockResolvedValue({ data: [], total: 0, page: 1, pages: 1 });
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.restoreAllMocks();
  vi.clearAllMocks();
  setLanguage('en');
});
it('filters a local calendar day using its actual daylight-saving boundaries', async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: /Date filter/ }));
  fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-03-29' } });
  fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-03-29' } });
  const start = new Date('2026-03-29T00:00:00');
  const end = new Date('2026-03-30T00:00:00');
  await waitFor(() => {
    const query = new URLSearchParams(vi.mocked(api.catches).mock.lastCall![0]);
    expect(query.get('fromInstant')).toBe(start.toISOString());
    expect(query.get('toExclusive')).toBe(end.toISOString());
    if (process.env.TZ === 'Europe/Warsaw') {
      expect(end.getTime() - start.getTime()).toBe(23 * 60 * 60 * 1000);
    }
  });
});
it('groups brand casing, distinguishes sizes/colors and filters by the selected ID', async () => {
  const user = userEvent.setup();
  const { container } = mount();
  const input = screen.getByRole('combobox', { name: 'Filter by lure' });
  expect(input).toHaveValue('All lures');
  await user.click(input);
  const short = await screen.findByRole('option', {
    name: 'Savage Gear · Jerk Buster II · 90 mm · Perch',
  });
  expect(
    screen.getByRole('option', { name: 'Savage Gear · Jerk Buster II · 150 mm · Firetiger' }),
  ).toBeVisible();
  expect(within(screen.getByRole('listbox')).getAllByRole('group')).toHaveLength(1);
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map((item) => item.id)).toEqual([]);
  await user.click(short);
  await waitFor(() =>
    expect(api.catches).toHaveBeenLastCalledWith(expect.stringContaining(`lure=${small._id}`)),
  );
  await waitFor(() => expect(input).toHaveValue('Savage Gear · Jerk Buster II · 90 mm · Perch'));
  await user.click(input);
  await user.click(screen.getByRole('option', { name: 'All lures' }));
  await waitFor(() => expect(api.catches).toHaveBeenLastCalledWith('search=&sort=date&page=1'));
});
it('supports keyboard selection, Escape, and resets journal pagination', async () => {
  vi.mocked(api.catches).mockResolvedValue({ data: [], total: 25, page: 1, pages: 3 });
  const user = userEvent.setup();
  mount();
  await user.click(await screen.findByRole('button', { name: 'Next' }));
  await waitFor(() =>
    expect(api.catches).toHaveBeenLastCalledWith(expect.stringContaining('page=2')),
  );
  const input = screen.getByRole('combobox', { name: 'Filter by lure' });
  await user.click(input);
  await screen.findByRole('option', { name: /90 mm/ });
  await user.keyboard('{ArrowDown}{Enter}');
  await waitFor(() =>
    expect(api.catches).toHaveBeenLastCalledWith(`search=&sort=date&page=1&lure=${small._id}`),
  );
  await user.click(input);
  await user.keyboard('{Escape}');
  expect(input).toHaveAttribute('aria-expanded', 'false');
  expect(input).toHaveFocus();
});
it('searches the server and loads additional pages of matching lures', async () => {
  vi.mocked(api.lures).mockImplementation(async (query) => {
    const page = Number(new URLSearchParams(query).get('page') ?? 1);
    return { data: page === 1 ? [small] : [large], total: 21, page, pages: 2 };
  });
  const user = userEvent.setup();
  mount();
  const input = screen.getByRole('combobox', { name: 'Filter by lure' });
  await user.click(input);
  await user.type(input, 'Jerk');
  await waitFor(() =>
    expect(api.lures).toHaveBeenCalledWith(
      'search=Jerk&sort=name&page=1&limit=20',
      expect.anything(),
    ),
  );
  await user.click(await screen.findByRole('button', { name: 'Load more lures' }));
  expect(await screen.findByRole('option', { name: /150 mm/ })).toBeVisible();
  expect(api.lures).toHaveBeenCalledWith(
    'search=Jerk&sort=name&page=2&limit=20',
    expect.anything(),
  );
});
it('resolves a preselected lure independently of the loaded page', async () => {
  vi.mocked(api.lures).mockResolvedValue({ data: [small], total: 1, page: 1, pages: 1 });
  mount(`/catches?lure=${large._id}`);
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Filter by lure' })).toHaveValue(
      'savage gear · Jerk Buster II · 150 mm · Firetiger',
    ),
  );
  expect(api.lure).toHaveBeenCalledWith(large._id);
});
it('offers retry on errors and All lures when no matches are found in Polish', async () => {
  setLanguage('pl');
  vi.mocked(api.lures).mockRejectedValueOnce(new Error('Offline'));
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('combobox', { name: 'Filtruj według przynęty' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Nie udało się wczytać listy przynęt.',
  );
  vi.mocked(api.lures).mockResolvedValue({ data: [], total: 0, page: 1, pages: 1 });
  await user.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));
  expect(await screen.findByText('Brak wyników. Spróbuj innej nazwy lub marki.')).toBeVisible();
  expect(screen.getByRole('option', { name: 'Wszystkie przynęty' })).toBeVisible();
});
