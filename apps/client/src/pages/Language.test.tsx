import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import axe from 'axe-core';
import { LanguageSettings } from '../components/settings/LanguageSettings';
import {
  t,
  getLanguage,
  getLocale,
  initializeLanguage,
  setLanguage,
  numberLabel,
  countLabel,
  canonicalSpecies,
} from '../lib/i18n';
import { api, data, ApiError, dateLabel } from '../lib/api';
import { useAuth } from '../lib/auth';
import Collection from './Collection';
import Forms from './Forms';
import Auth from './Auth';

vi.mock('../lib/auth', () => ({ useAuth: vi.fn() }));
vi.mock('../lib/api', async (original) => {
  const actual = await original<typeof import('../lib/api')>();
  return { ...actual, data: vi.fn(), api: { ...actual.api, lures: vi.fn(), lure: vi.fn() } };
});
const lure = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Original Floater',
  brand: 'Savage Gear',
  type: 'Hard Bait' as const,
  lengthMm: 90,
  catchCount: 2,
  createdAt: '2026-10-01T00:00:00Z',
};
const clients: QueryClient[] = [];
function mount(element: React.ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={element} />
          <Route path="/lures/saved" element={<p>Lure saved</p>} />
          <Route path="/catches/saved" element={<p>Catch saved</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  setLanguage('en');
  vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, error: null, refresh: vi.fn() });
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(data).mockImplementation(async (path) =>
    path === '/lure-filters' ? ['Savage Gear'] : { _id: 'saved' },
  );
});
afterEach(() => {
  cleanup();
  clients.forEach((client) => client.clear());
  clients.length = 0;
  setLanguage('en');
  localStorage.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it('switches the live collection, keeps user content, and preserves canonical filter values', async () => {
  const user = userEvent.setup();
  const { container } = mount(
    <>
      <LanguageSettings />
      <Collection />
    </>,
  );
  expect(await screen.findByText('Original Floater')).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Language preference'), 'pl');
  expect(screen.getByRole('heading', { name: 'Twoja kolekcja przynęt' })).toBeVisible();
  expect(screen.getByRole('option', { name: 'Savage Gear' })).toBeVisible();
  expect(screen.getByText('Original Floater')).toBeVisible();
  expect(document.documentElement.lang).toBe('pl');
  expect(localStorage.getItem('lurelog-language')).toBe('pl');
  await user.click(screen.getByRole('button', { name: 'Przynęta twarda' }));
  await waitFor(() => expect(api.lures).toHaveBeenCalledWith('type=Hard+Bait'));
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  expect(result.violations.map((item) => item.id)).toEqual([]);
  await user.selectOptions(screen.getByLabelText('Preferowany język'), 'en');
  expect(screen.getByRole('heading', { name: 'Your lure collection' })).toBeVisible();
});
it('restores a saved choice at startup and responds to language changes in another tab', () => {
  localStorage.setItem('lurelog-language', 'pl');
  const stop = initializeLanguage();
  try {
    expect(getLanguage()).toBe('pl');
    expect(document.documentElement.lang).toBe('pl');
    expect(getLocale()).toBe('pl-PL');
    act(() => {
      localStorage.setItem('lurelog-language', 'en');
      window.dispatchEvent(new StorageEvent('storage', { key: 'lurelog-language' }));
    });
    expect(getLanguage()).toBe('en');
  } finally {
    stop();
  }
});
it('localizes numbers, dates, plurals, and common fish names without changing custom species', () => {
  setLanguage('pl');
  expect(numberLabel(2.4)).toBe('2,4');
  expect(countLabel(1, 'catch')).toBe('1 połów');
  expect(countLabel(2, 'catch')).toBe('2 połowy');
  expect(countLabel(5, 'catch')).toBe('5 połowów');
  expect(countLabel(22, 'catch')).toBe('22 połowy');
  expect(dateLabel('2026-10-01T12:00:00Z')).toContain('paź');
  expect(canonicalSpecies('Szczupak')).toBe('Northern Pike');
  expect(canonicalSpecies('Moja ryba')).toBe('Moja ryba');
  expect(t('__proto__')).toBe('__proto__');
  expect(t('constructor')).toBe('constructor');
  expect(t('My {{custom}} species')).toBe('My {{custom}} species');
});
it('submits a Polish lure form with canonical API values and unchanged user-entered names', async () => {
  setLanguage('pl');
  const user = userEvent.setup();
  mount(<Forms kind="lure" />, '/lures/new');
  await user.type(screen.getByLabelText(/Model \/ nazwa/), 'Moja przynęta');
  await user.type(screen.getByLabelText(/^Marka/), 'Savage Gear');
  await user.type(screen.getByLabelText(/Długość \(mm\)/), '90');
  expect(screen.getByLabelText(/Rodzaj przynęty/)).toHaveValue('Hard Bait');
  await user.click(screen.getByRole('button', { name: 'Dodaj do kolekcji' }));
  expect(await screen.findByText('Lure saved')).toBeVisible();
  const options = vi.mocked(data).mock.calls.find((call) => call[0] === '/lures')?.[1];
  expect(JSON.parse(String(options?.body))).toMatchObject({
    name: 'Moja przynęta',
    brand: 'Savage Gear',
    type: 'Hard Bait',
    lengthMm: 90,
  });
});
it('offers Polish authentication validation and translated API errors while retaining entered fields', async () => {
  const user = userEvent.setup();
  mount(<Auth register />);
  await user.selectOptions(screen.getByLabelText('Language preference'), 'pl');
  await user.click(screen.getByRole('button', { name: 'Utwórz bezpłatne konto' }));
  expect(await screen.findByText('Użyj co najmniej 12 znaków')).toBeVisible();
  await user.type(screen.getByLabelText(/^Twoje imię/), 'Piotr');
  await user.type(screen.getByLabelText(/^Adres e-mail/), 'piotr@example.com');
  await user.type(screen.getByLabelText(/^Hasło/), 'a-strong-password');
  vi.mocked(data).mockRejectedValueOnce(
    new ApiError(409, 'This email address is already registered'),
  );
  await user.click(screen.getByRole('button', { name: 'Utwórz bezpłatne konto' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Ten adres e-mail jest już zarejestrowany',
  );
  await user.selectOptions(screen.getByLabelText('Preferowany język'), 'en');
  expect(screen.getByLabelText('Email address')).toHaveValue('piotr@example.com');
  expect(screen.getByRole('alert')).toHaveTextContent('This email address is already registered');
});

it('submits a Polish catch with a canonical species and the selected owned lure', async () => {
  setLanguage('pl');
  const user = userEvent.setup();
  mount(<Forms kind="catch" />, '/catches/new');
  await user.click(screen.getByRole('combobox', { name: /Użyta przynęta/ }));
  await user.click(await screen.findByRole('option', { name: /Savage Gear Original Floater/ }));
  await user.type(screen.getByLabelText(/Gatunek ryby/), 'Szczupak');
  await user.click(screen.getByRole('button', { name: 'Zapisz połów' }));
  expect(await screen.findByText('Catch saved')).toBeVisible();
  const options = vi.mocked(data).mock.calls.find((call) => call[0] === '/catches')?.[1];
  expect(JSON.parse(String(options?.body))).toMatchObject({
    species: 'Northern Pike',
    lureId: lure._id,
  });
});
