import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import Details from './Details';
import Collection from './Collection';
import Journal from './Journal';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Original Floater',
  brand: 'Rapala',
  type: 'Hard Bait',
  lengthMm: 90,
  catchCount: 1,
  createdAt: '2026-10-01T00:00:00Z',
};
const fish = {
  _id: '507f1f77bcf86cd799439012',
  lureId: lure,
  species: 'Northern Pike',
  caughtAt: '2026-10-20T08:00:00Z',
  createdAt: '2026-10-20T08:00:00Z',
};

function mount(kind: 'lure' | 'catch', failDelete = false) {
  let deleted = false;
  const record = kind === 'lure' ? lure : fish;
  const base = kind === 'lure' ? '/lures' : '/catches';
  const recordPath = `${base}/${record._id}`;
  const fetchMock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const path = url.pathname.replace('/api/v1', '');
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    if (path === '/csrf') return json({ data: { token: 'test-csrf-token' } });
    if (options?.method === 'DELETE' && path === recordPath) {
      if (failDelete) return json({ error: { message: 'Deletion failed. Please retry.' } }, 500);
      deleted = true;
      return new Response(null, { status: 204 });
    }
    if (path === recordPath) {
      return deleted
        ? json({ error: { message: 'Record not found' } }, 404)
        : json({ data: record });
    }
    if (path === '/lure-filters') return json({ data: ['Rapala'] });
    if (path === '/lures' || path === '/catches') {
      const items = path === '/lures' ? [lure] : [fish];
      const remaining = deleted && (path === base || kind === 'lure') ? [] : items;
      return json({
        data: remaining,
        total: remaining.length,
        page: 1,
        pages: remaining.length ? 1 : 0,
      });
    }
    throw new Error(`Unexpected request: ${options?.method ?? 'GET'} ${path}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60000 } },
  });
  client.setQueryData(['stats'], { totalCatches: 1 });
  client.setQueryData(['session'], { name: 'Alex' });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[recordPath]}>
        <Routes>
          <Route path={`${base}/:id`} element={<Details kind={kind} />} />
          <Route path="/lures" element={<Collection />} />
          <Route path="/catches" element={<Journal />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { client, fetchMock, recordPath };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe.each(['lure', 'catch'] as const)('%s deletion', (kind) => {
  it('accepts an empty 204 response and returns to the refreshed collection or journal', async () => {
    const user = userEvent.setup();
    const { client, fetchMock, recordPath } = mount(kind);
    await user.click(await screen.findByRole('button', { name: `Delete ${kind}` }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));

    expect(
      await screen.findByRole('heading', {
        name: kind === 'lure' ? 'Your lure collection' : 'Your fishing journal',
      }),
    ).toBeVisible();
    expect(
      await screen.findByRole('heading', {
        name:
          kind === 'lure'
            ? 'Your collection starts with one lure.'
            : 'The best stories are still ahead.',
      }),
    ).toBeVisible();
    expect(toast.success).toHaveBeenCalledWith('Deleted successfully');
    expect(toast.error).not.toHaveBeenCalled();
    expect(
      fetchMock.mock.calls.filter(
        ([url, options]) => String(url) === `/api/v1${recordPath}` && options?.method === 'DELETE',
      ),
    ).toHaveLength(1);
    // No refetch of a deleted record while leaving its detail screen.
    expect(
      fetchMock.mock.calls.filter(
        ([url, options]) => String(url) === `/api/v1${recordPath}` && !options?.method,
      ),
    ).toHaveLength(1);
    expect(client.getQueryState(['stats'])?.isInvalidated).toBe(true);
    expect(client.getQueryState(['session'])?.isInvalidated).toBe(false);
  });

  it('stays on the detail page and reports actual server failures', async () => {
    const user = userEvent.setup();
    mount(kind, true);
    await user.click(await screen.findByRole('button', { name: `Delete ${kind}` }));
    await user.click(screen.getByRole('button', { name: 'Yes, delete' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Deletion failed. Please retry.'));
    expect(
      screen.getByRole('heading', {
        name: kind === 'lure' ? 'Original Floater' : 'Northern Pike',
      }),
    ).toBeVisible();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const { fetchMock } = mount(kind);
    await user.click(await screen.findByRole('button', { name: `Delete ${kind}` }));
    await user.click(screen.getByRole('button', { name: 'Keep it' }));
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false);
    expect(screen.getByRole('button', { name: `Delete ${kind}` })).toBeVisible();
  });
});
