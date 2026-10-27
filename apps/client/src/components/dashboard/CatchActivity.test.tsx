import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import axe from 'axe-core';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Stats } from '@lurelog/shared';
import { CatchActivity } from './CatchActivity';
import { api } from '../../lib/api';
vi.mock('./ActivityChart', () => ({ ActivityChart: () => <div aria-hidden="true" /> }));
vi.mock('../../lib/api', () => ({ api: { activity: vi.fn() } }));
const stats: Stats = {
  totalLures: 1,
  totalCatches: 3,
  uniqueSpecies: 1,
  topLures: [],
  recentCatches: [],
  activity: [],
  species: [],
};
const clients: QueryClient[] = [];
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <CatchActivity stats={stats} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2024-02-15T12:00:00Z'));
  vi.mocked(api.activity).mockImplementation(async (month) => ({
    month,
    total: 3,
    days: [
      { date: `${month}-01`, count: 2 },
      { date: `${month}-02`, count: 0 },
      { date: `${month}-03`, count: 1 },
    ],
  }));
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.resetAllMocks();
  vi.useRealTimers();
});
it('opens the current month and exposes exact daily counts including zero days', async () => {
  const user = userEvent.setup();
  const { container } = mount();
  expect(screen.queryByLabelText('Look closer at a month')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Explore month' }));
  expect(await screen.findByRole('status')).toHaveTextContent('3 catches in February 2024');
  expect(api.activity).toHaveBeenCalledWith('2024-02');
  await user.click(screen.getByText('View daily catch totals'));
  const rows = within(screen.getByRole('table')).getAllByRole('row');
  expect(rows).toHaveLength(4);
  expect(within(rows[1]).getByRole('cell')).toHaveTextContent(/^2$/);
  expect(within(rows[1]).getByRole('rowheader')).toHaveTextContent(
    new Date('2024-02-01T00:00:00Z').toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }),
  );
  expect(within(rows[2]).getByRole('cell')).toHaveTextContent(/^0$/);
  const accessibility = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(accessibility.violations.map((item) => item.id)).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'Monthly view' }));
  expect(screen.getByRole('button', { name: 'Explore month' })).toBeVisible();
});
it('drills down through the data table and navigates across year boundaries', async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByText('View activity data'));
  await user.click(screen.getByRole('button', { name: 'Jan' }));
  await user.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(screen.getByText('December 2023', { exact: true })).toBeVisible();
  expect(await screen.findByRole('status')).toHaveTextContent('December 2023');
  await user.click(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByText('January 2024', { exact: true })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Next month' }));
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('February 2024'));
});
it('shows loading, retryable errors, and an empty month without stale totals', async () => {
  const user = userEvent.setup();
  vi.mocked(api.activity).mockImplementation(() => new Promise(() => {}));
  mount();
  await user.click(screen.getByRole('button', { name: 'Explore month' }));
  expect(screen.getByRole('status')).toHaveTextContent('Loading daily catches');
  vi.mocked(api.activity).mockRejectedValueOnce(new Error('Offline'));
  await user.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Daily activity could not be loaded');
  vi.mocked(api.activity).mockResolvedValueOnce({ month: '2024-02', total: 0, days: [] });
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText(/No catches recorded in/)).toBeVisible();
});
it('opens the current month again after returning from a different month', async () => {
  const user = userEvent.setup();
  mount();
  await user.click(screen.getByRole('button', { name: 'Explore month' }));
  await user.click(screen.getByRole('button', { name: 'Previous month' }));
  expect(screen.getByText('January 2024', { exact: true })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Monthly view' }));
  await user.click(screen.getByRole('button', { name: 'Explore month' }));
  expect(screen.getByText('February 2024', { exact: true })).toBeVisible();
  expect(api.activity).toHaveBeenLastCalledWith('2024-02');
});
