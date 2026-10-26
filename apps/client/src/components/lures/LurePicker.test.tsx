import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Lure } from '@lurelog/shared';
import LurePicker from './LurePicker';
import Forms from '../../pages/Forms';
import { api, ApiError, data } from '../../lib/api';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  api: { lures: vi.fn(), lure: vi.fn(), catch: vi.fn() },
  data: vi.fn(),
}));
const first: Lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Original Floater',
  brand: 'Rapala',
  type: 'Hard Bait',
  lengthMm: 90,
  catchCount: 0,
  createdAt: '2026-10-01',
};
const second: Lure = {
  ...first,
  _id: '507f1f77bcf86cd799439012',
  name: 'Slider 10',
  brand: 'Salmo',
  type: 'Hard Bait',
  lengthMm: 100,
};
const page = (items: Lure[], current = 1, pages = 1) => ({
  data: items,
  total: items.length,
  page: current,
  pages,
});
function Harness({ selectedId = '' }: { selectedId?: string }) {
  const form = useForm({ defaultValues: { lureId: selectedId } });
  const selected = useWatch({ control: form.control, name: 'lureId' });
  return (
    <FormProvider {...form}>
      <LurePicker />
      <output aria-label="Selected lure ID">{selected}</output>
      <button>Outside picker</button>
    </FormProvider>
  );
}
function mount(
  selectedId = '',
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60000 } } }),
) {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Harness selectedId={selectedId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}
beforeEach(() => {
  vi.mocked(api.lures).mockResolvedValue(page([first, second]));
  vi.mocked(api.lure).mockImplementation(async (id) => (id === first._id ? first : second));
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('searchable catch lure picker', () => {
  it('searches by brand, selects the matching lure, and keeps selection when browsing another search', async () => {
    vi.mocked(api.lures).mockImplementation(async (query) => {
      const search = new URLSearchParams(query).get('search');
      return page(search === 'Salmo' ? [second] : search === 'Rapala' ? [first] : [first, second]);
    });
    const user = userEvent.setup();
    mount();
    const input = screen.getByRole('combobox', { name: /Lure used/ });
    await user.type(input, 'Salmo');
    await waitFor(() =>
      expect(api.lures).toHaveBeenCalledWith(
        expect.stringContaining('search=Salmo'),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      ),
    );
    expect(await screen.findByRole('option', { name: /Salmo Slider 10/ })).toBeVisible();
    expect(screen.queryByRole('option', { name: /Rapala/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /Salmo Slider 10/ }));
    await waitFor(() => expect(input).toHaveValue('Salmo Slider 10'));
    expect(screen.getByLabelText('Selected lure ID')).toHaveTextContent(second._id);
    await user.click(input);
    await user.type(input, 'Rapala');
    expect(await screen.findByRole('option', { name: /Rapala Original Floater/ })).toBeVisible();
    expect(screen.getByLabelText('Selected lure ID')).toHaveTextContent(second._id);
  });

  it('does not show cached deleted options while refreshing the collection', async () => {
    let resolve!: (value: ReturnType<typeof page>) => void;
    vi.mocked(api.lures).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 60000 } },
    });
    client.setQueryData(['lure-options', ''], { pages: [page([first])], pageParams: [1] });
    const user = userEvent.setup();
    mount('', client);
    await user.click(screen.getByRole('combobox', { name: /Lure used/ }));
    expect(screen.queryByRole('option', { name: /Rapala/ })).not.toBeInTheDocument();
    resolve(page([second]));
    expect(await screen.findByRole('option', { name: /Salmo/ })).toBeVisible();
    expect(screen.queryByRole('option', { name: /Rapala/ })).not.toBeInTheDocument();
  });

  it('clears a deleted preselection even when its detail is cached', async () => {
    vi.mocked(api.lure).mockRejectedValue(new ApiError(404, 'Record not found'));
    vi.mocked(api.lures).mockResolvedValue(page([second]));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(['lure', first._id], first);
    mount(first._id, client);
    expect(
      await screen.findByText('That lure is no longer in your collection. Choose another lure.'),
    ).toBeVisible();
    await waitFor(() => expect(screen.getByLabelText('Selected lure ID')).toBeEmptyDOMElement());
    expect(screen.queryByText('Rapala Original Floater')).not.toBeInTheDocument();
    expect(await screen.findByRole('option', { name: /Salmo/ })).toBeVisible();
  });

  it('shows a preselected lure only once and supports keyboard selection', async () => {
    const user = userEvent.setup();
    mount(first._id);
    const input = screen.getByRole('combobox', { name: /Lure used/ });
    await waitFor(() => expect(input).toHaveValue('Rapala Original Floater'));
    await user.click(input);
    const list = await screen.findByRole('listbox');
    await waitFor(() =>
      expect(within(list).getAllByRole('option', { name: /Rapala/ })).toHaveLength(1),
    );
    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByLabelText('Selected lure ID')).toHaveTextContent(second._id);
    await user.click(screen.getByRole('button', { name: 'Clear selected lure' }));
    expect(screen.getByLabelText('Selected lure ID')).toBeEmptyDOMElement();
  });

  it('loads additional matching lures instead of truncating the collection', async () => {
    vi.mocked(api.lures).mockImplementation(async (query) =>
      new URLSearchParams(query).get('page') === '2' ? page([second], 2, 2) : page([first], 1, 2),
    );
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('combobox', { name: /Lure used/ }));
    await user.click(await screen.findByRole('button', { name: 'Load more lures' }));
    expect(await screen.findByRole('option', { name: /Salmo/ })).toBeVisible();
    expect(screen.getByRole('option', { name: /Rapala/ })).toBeVisible();
  });

  it('distinguishes no matches from a failed search and supports retry', async () => {
    const user = userEvent.setup();
    mount();
    const input = screen.getByRole('combobox', { name: /Lure used/ });
    vi.mocked(api.lures).mockResolvedValue(page([]));
    await user.type(input, 'Unknown');
    expect(
      await screen.findByText('No lures match your search. Try another name or brand.'),
    ).toBeVisible();
    vi.mocked(api.lures).mockRejectedValue(new Error('Connection interrupted'));
    await user.clear(input);
    await user.type(input, 'Salmo');
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted');
    vi.mocked(api.lures).mockResolvedValue(page([second]));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('option', { name: /Salmo/ })).toBeVisible();
  });

  it('blocks saving if a lure was deleted after it was selected', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/catches/new']}>
          <Routes>
            <Route path="/catches/new" element={<Forms kind="catch" />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await user.click(screen.getByRole('combobox', { name: /Lure used/ }));
    await user.click(await screen.findByRole('option', { name: /Rapala/ }));
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: /Lure used/ })).toHaveValue(
        'Rapala Original Floater',
      ),
    );
    await user.type(screen.getByLabelText(/Fish species/), 'Northern Pike');
    vi.mocked(api.lure).mockRejectedValue(new ApiError(404, 'Record not found'));
    await user.click(screen.getByRole('button', { name: 'Save catch' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That lure is no longer in your collection',
    );
    expect(data).not.toHaveBeenCalled();
  });
});
