import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Auth from './Auth';
import Forms from './Forms';
import Collection from './Collection';
import { ImageUpload } from '../components/common';
import { api, data, ApiError } from '../lib/api';
import { AuthProvider, useAuth } from '../lib/auth';
vi.mock('../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api')>();
  return {
    ...actual,
    data: vi.fn(),
    api: { ...actual.api, me: vi.fn(), lures: vi.fn(), lure: vi.fn(), catch: vi.fn() },
    upload: vi.fn(),
  };
});
const lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Original Floater',
  brand: 'Rapala',
  type: 'Hard Bait' as const,
  lengthMm: 90,
  catchCount: 2,
  createdAt: '2026-10-01T00:00:00Z',
};
function SessionEvidence() {
  const { user } = useAuth();
  return <div>{user ? 'Dashboard loaded' : 'Session missing'}</div>;
}
function mount(element: React.ReactNode, path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <Routes>
            <Route path="*" element={element} />
            <Route path="/dashboard" element={<SessionEvidence />} />
            <Route path={`/lures/${lure._id}`} element={<div>Lure saved</div>} />
            <Route path="/catches/saved" element={<div>Catch saved</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.mocked(api.me).mockRejectedValue(new ApiError(401, 'Please sign in'));
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(data).mockResolvedValue([]);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
describe('account forms', () => {
  it('validates registration before calling the API', async () => {
    const user = userEvent.setup();
    mount(<Auth register />);
    await user.click(screen.getByRole('button', { name: 'Create your free account' }));
    expect(await screen.findByText('Use at least 12 characters')).toBeVisible();
    expect(data).not.toHaveBeenCalled();
  });
  it('submits a working login and navigates to the dashboard', async () => {
    vi.mocked(data).mockResolvedValue({ _id: 'user', name: 'Alex', email: 'alex@example.com' });
    const user = userEvent.setup();
    mount(<Auth />);
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'strong-password-123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Dashboard loaded')).toBeVisible();
    expect(data).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'alex@example.com', password: 'strong-password-123' }),
    });
  });
  it('registers and synchronizes the live session provider before navigation', async () => {
    vi.mocked(data).mockResolvedValue({
      _id: 'registered',
      name: 'River Angler',
      email: 'river@example.com',
    });
    const user = userEvent.setup();
    mount(<Auth register />);
    await user.type(screen.getByLabelText('Your name'), 'River Angler');
    await user.type(screen.getByLabelText('Email address'), 'river@example.com');
    await user.type(screen.getByLabelText('Password'), 'strong-password-789');
    await user.click(screen.getByRole('button', { name: 'Create your free account' }));
    expect(await screen.findByText('Dashboard loaded')).toBeVisible();
    expect(data).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });
  it('restores an existing session on page load', async () => {
    vi.mocked(api.me).mockResolvedValue({
      _id: 'existing',
      name: 'Alex',
      email: 'alex@example.com',
      createdAt: '2026-10-01',
    });
    mount(<Auth />);
    expect(await screen.findByText('Dashboard loaded')).toBeVisible();
  });
  it('shows server errors from login', async () => {
    vi.mocked(data).mockRejectedValue(new Error('Email or password is incorrect'));
    const user = userEvent.setup();
    mount(<Auth />);
    await user.type(screen.getByLabelText('Email address'), 'alex@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
  });
});
describe('record forms', () => {
  it('requires essential lure fields', async () => {
    const user = userEvent.setup();
    mount(<Forms kind="lure" />, '/lures/new');
    await user.click(screen.getByRole('button', { name: 'Add to collection' }));
    expect(await screen.findByText('Model is required')).toBeVisible();
    expect(data).not.toHaveBeenCalled();
  });
  it('saves numeric lure data through the API', async () => {
    vi.mocked(data).mockResolvedValue(lure);
    const user = userEvent.setup();
    mount(<Forms kind="lure" />, '/lures/new');
    await user.type(screen.getByLabelText(/Model \/ name/), 'Original Floater');
    await user.type(screen.getByLabelText(/Brand/), 'Rapala');
    await user.type(screen.getByLabelText(/Length \(mm\)/), '90');
    await user.click(screen.getByRole('button', { name: 'Add to collection' }));
    expect(await screen.findByText('Lure saved')).toBeVisible();
    const args = vi.mocked(data).mock.calls.find((c) => c[0] === '/lures');
    expect(JSON.parse(args![1]!.body as string)).toMatchObject({
      name: 'Original Floater',
      lengthMm: 90,
    });
  });
  it('requires a lure and species, then accepts a custom species', async () => {
    vi.mocked(data).mockResolvedValue({ _id: 'saved' });
    const user = userEvent.setup();
    mount(<Forms kind="catch" />, '/catches/new');
    await user.click(screen.getByRole('combobox', { name: /Lure used/ }));
    await screen.findByRole('option', { name: /Rapala Original Floater/ });
    await user.click(screen.getByRole('button', { name: 'Save catch' }));
    expect(await screen.findByText('Species is required')).toBeVisible();
    expect(data).not.toHaveBeenCalled();
    await user.click(screen.getByRole('combobox', { name: /Lure used/ }));
    await user.click(await screen.findByRole('option', { name: /Rapala Original Floater/ }));
    await user.type(screen.getByLabelText(/Fish species/), 'Wild River Char');
    await user.click(screen.getByRole('button', { name: 'Save catch' }));
    expect(await screen.findByText('Catch saved')).toBeVisible();
    const args = vi.mocked(data).mock.calls.find((c) => c[0] === '/catches');
    expect(JSON.parse(args![1]!.body as string)).toMatchObject({
      species: 'Wild River Char',
      lureId: lure._id,
    });
  });
  it('shows a useful empty state before logging a catch without lures', async () => {
    vi.mocked(api.lures).mockResolvedValue({ data: [], total: 0, page: 1, pages: 0 });
    mount(<Forms kind="catch" />, '/catches/new');
    expect(await screen.findByText('First, a lure for your story.')).toBeVisible();
  });
});
describe('collection synchronization', () => {
  it('links the lure card and its catch action to their respective pages', async () => {
    mount(<Collection />, '/lures');
    expect(await screen.findByRole('link', { name: 'View Rapala Original Floater' })).toHaveAttribute(
      'href',
      `/lures/${lure._id}`,
    );
    expect(screen.getByRole('link', { name: 'Log catch' })).toHaveAttribute(
      'href',
      `/lures/${lure._id}/catches/new`,
    );
    expect(screen.queryByText('Ready for the water')).not.toBeInTheDocument();
  });
  it('filters by type and searches through the server API', async () => {
    const user = userEvent.setup();
    mount(<Collection />, '/lures');
    expect(await screen.findByText('Original Floater')).toBeVisible();
    for (const type of ['Hard Bait', 'Soft Lure', 'Spinner', 'Spoon', 'Fly', 'Other']) {
      expect(screen.getByRole('button', { name: type })).toBeVisible();
    }
    expect(screen.queryByRole('button', { name: 'Crankbait' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hard Bait' }));
    await waitFor(() => expect(api.lures).toHaveBeenCalledWith('type=Hard+Bait'));
    await user.type(screen.getByRole('textbox', { name: 'Search lures' }), 'Rapala');
    await waitFor(() => expect(api.lures).toHaveBeenCalledWith('type=Hard+Bait&search=Rapala'));
  });
  it('exposes loading and server failure states', async () => {
    vi.mocked(api.lures).mockImplementationOnce(() => new Promise(() => {}));
    const { unmount } = mount(<Collection />, '/lures');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeVisible();
    unmount();
    vi.mocked(api.lures).mockRejectedValueOnce(new Error('Database unavailable'));
    mount(<Collection />, '/lures');
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
it('rejects invalid and oversized photo selections before upload', async () => {
  const user = userEvent.setup({ applyAccept: false });
  const onChange = vi.fn();
  mount(<ImageUpload file={null} onChange={onChange} />);
  const input = document.querySelector('input[hidden]') as HTMLInputElement;
  await user.upload(input, new File(['not an image'], 'document.txt', { type: 'text/plain' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG, PNG, or WebP');
  expect(onChange).not.toHaveBeenCalled();
  await user.upload(
    input,
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'fish.png', { type: 'image/png' }),
  );
  expect(screen.getByRole('alert')).toHaveTextContent('5 MB');
  expect(onChange).not.toHaveBeenCalled();
});
