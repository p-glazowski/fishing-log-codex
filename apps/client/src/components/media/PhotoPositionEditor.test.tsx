import { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FishCatch } from '@lurelog/shared';
import axe from 'axe-core';
import { PhotoPositionEditor } from './PhotoPositionEditor';
import { RecordForm } from '../../features/records/RecordForm';
import { CatchCard } from '../cards/RecordCards';
import { api, data, upload } from '../../lib/api';
vi.mock('../../lib/api', async (original) => {
  const actual = await original<typeof import('../../lib/api')>();
  return {
    ...actual,
    data: vi.fn(),
    upload: vi.fn(),
    api: { ...actual.api, lure: vi.fn(), lures: vi.fn() },
  };
});
const photo = {
  _id: 'photo',
  provider: 'local' as const,
  fileId: 'owner/photo.webp',
  url: '/media/photo',
};
const catchRecord: FishCatch = {
  _id: '507f1f77bcf86cd799439012',
  lureId: '507f1f77bcf86cd799439011',
  species: 'Northern Pike',
  caughtAt: '2026-10-01T08:00:00Z',
  createdAt: '2026-10-01T08:00:00Z',
  photo,
  photoPosition: { x: 20, y: 70 },
};
it('allows undoing saved-photo removal and sends deletion only when the edit is saved', async () => {
  vi.mocked(api.lure).mockResolvedValue({
    _id: String(catchRecord.lureId),
    name: 'Aglia',
    brand: 'Mepps',
    type: 'Spinner',
    lengthMm: 45,
    catchCount: 1,
    createdAt: '2026-10-01',
  });
  vi.mocked(api.lures).mockResolvedValue({ data: [], total: 0, page: 1, pages: 0 });
  vi.mocked(data).mockResolvedValue(catchRecord);
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route path="/edit" element={<RecordForm kind="catch" initial={catchRecord} />} />
          <Route path={`/catches/${catchRecord._id}`} element={<h1>Saved without photo</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'Remove photo' }));
  expect(screen.getByRole('status')).toHaveTextContent('Photo will be removed when you save.');
  expect(data).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Undo' }));
  expect(screen.getByAltText('Selected upload preview')).toHaveAttribute('src', photo.url);
  await user.click(screen.getByRole('button', { name: 'Remove photo' }));
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('heading', { name: 'Saved without photo' })).toBeVisible();
  expect(data).toHaveBeenCalledWith(`/catches/${catchRecord._id}/photo`, { method: 'DELETE' });
  expect(upload).not.toHaveBeenCalled();
  client.clear();
});
function ControlledEditor() {
  const [value, onChange] = useState({ x: 50, y: 50 });
  return <PhotoPositionEditor src="/photo.webp" value={value} onChange={onChange} />;
}
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
it('positions the mask with accessible controls and resets it to center', async () => {
  const user = userEvent.setup();
  const { container } = render(<ControlledEditor />);
  const image = screen.getByAltText('Selected upload preview');
  Object.defineProperties(image, { naturalWidth: { value: 1000 }, naturalHeight: { value: 2000 } });
  fireEvent.load(image);
  await user.click(screen.getByText('Adjust with controls'));
  fireEvent.change(screen.getByLabelText('Vertical position'), { target: { value: '10' } });
  const mask = container.querySelector('.photo-position-mask')!;
  expect(mask).toHaveStyle({ width: '100%' });
  expect(parseFloat((mask as HTMLElement).style.top)).toBeCloseTo(6.67, 2);
  expect(
    (await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })).violations,
  ).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'Center photo' }));
  expect(screen.getByLabelText('Vertical position')).toHaveValue('50');
});
it.each([
  { width: 1000, height: 2000, dx: 0, dy: 40, axis: 'Vertical position', expected: 80 },
  { width: 2000, height: 1000, dx: 25, dy: 0, axis: 'Horizontal position', expected: 100 },
])(
  'drags the crop mask for $width × $height photos',
  ({ width, height, dx, dy, axis, expected }) => {
    class Pointer extends MouseEvent {
      pointerId: number;
      constructor(type: string, options: PointerEventInit) {
        super(type, options);
        this.pointerId = options.pointerId ?? 1;
      }
    }
    vi.stubGlobal('PointerEvent', Pointer);
    render(<ControlledEditor />);
    const image = screen.getByAltText('Selected upload preview');
    Object.defineProperties(image, {
      naturalWidth: { value: width },
      naturalHeight: { value: height },
    });
    fireEvent.load(image);
    const frame = image.parentElement!;
    vi.spyOn(frame, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 200,
    } as DOMRect);
    Object.defineProperty(frame, 'setPointerCapture', { value: vi.fn(), configurable: true });
    fireEvent.pointerDown(frame, { button: 0, pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
    expect(screen.getByLabelText(axis)).toHaveValue(String(expected));
    fireEvent.pointerUp(frame, { pointerId: 1 });
    fireEvent.pointerMove(frame, { pointerId: 1, clientX: 800, clientY: 800 });
    expect(screen.getByLabelText(axis)).toHaveValue(String(expected));
  },
);
it('saves the position on an existing catch without uploading or replacing the full photo', async () => {
  const lure = {
    _id: String(catchRecord.lureId),
    name: 'Original Floater',
    brand: 'Rapala',
    type: 'Hard Bait' as const,
    lengthMm: 90,
    catchCount: 1,
    createdAt: '2026-10-01',
  };
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
  vi.mocked(data).mockResolvedValue(catchRecord);
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const mounted = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route path="/edit" element={<RecordForm kind="catch" initial={catchRecord} />} />
          <Route path={`/catches/${catchRecord._id}`} element={<p>Saved catch</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'Adjust preview' }));
  expect(screen.getByLabelText('Vertical position')).toHaveValue('70');
  fireEvent.change(screen.getByLabelText('Vertical position'), { target: { value: '15' } });
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Saved catch');
  const saved = JSON.parse(String(vi.mocked(data).mock.calls[0][1]?.body));
  expect(saved.photoPosition).toEqual({ x: 20, y: 15 });
  expect(upload).not.toHaveBeenCalled();
  mounted.unmount();
  client.clear();
  render(
    <MemoryRouter>
      <CatchCard item={{ ...catchRecord, photoPosition: saved.photoPosition }} />
    </MemoryRouter>,
  );
  expect(screen.getByAltText('Northern Pike')).toHaveStyle({ objectPosition: '20% 15%' });
  expect(screen.getByAltText('Northern Pike')).toHaveAttribute('src', photo.url);
});
it('uses a centered crop for older catches without saved positioning', () => {
  render(
    <MemoryRouter>
      <CatchCard item={{ ...catchRecord, photoPosition: undefined }} />
    </MemoryRouter>,
  );
  expect(screen.getByAltText('Northern Pike')).toHaveStyle({ objectPosition: '50% 50%' });
});

it('centers a replacement photo, restores the old crop on removal, and saves a new crop with the upload', async () => {
  class PreviewURL extends URL {
    static createObjectURL = vi.fn(() => 'blob:preview');
    static revokeObjectURL = vi.fn();
  }
  vi.stubGlobal('URL', PreviewURL);
  const lure = {
    _id: String(catchRecord.lureId),
    name: 'Original Floater',
    brand: 'Rapala',
    type: 'Hard Bait' as const,
    lengthMm: 90,
    catchCount: 1,
    createdAt: '2026-10-01',
  };
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
  vi.mocked(data).mockResolvedValue(catchRecord);
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container, unmount } = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route path="/edit" element={<RecordForm kind="catch" initial={catchRecord} />} />
          <Route path={`/catches/${catchRecord._id}`} element={<p>Replacement saved</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const picker = container.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')!;
  const file = new File(['photo'], 'portrait.png', { type: 'image/png' });
  await user.click(screen.getByRole('button', { name: 'Adjust preview' }));
  await user.upload(picker, file);
  expect(screen.getByLabelText('Vertical position')).toHaveValue('50');
  await user.click(screen.getByRole('button', { name: 'Remove selected image' }));
  expect(screen.getByLabelText('Vertical position')).toHaveValue('70');
  await user.upload(picker, file);
  expect(screen.getByLabelText('Vertical position')).toHaveValue('50');
  fireEvent.change(screen.getByLabelText('Vertical position'), { target: { value: '80' } });
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Replacement saved');
  expect(JSON.parse(String(vi.mocked(data).mock.calls[0][1]?.body)).photoPosition).toEqual({
    x: 50,
    y: 80,
  });
  expect(upload).toHaveBeenCalledWith(`/catches/${catchRecord._id}/photo`, file);
  unmount();
  client.clear();
  expect(PreviewURL.revokeObjectURL).toHaveBeenCalled();
});

it.each([null, undefined])('saves crop edits when optional measurements are %s', async (empty) => {
  const lure = {
    _id: String(catchRecord.lureId),
    name: 'Original Floater',
    brand: 'Rapala',
    type: 'Hard Bait' as const,
    lengthMm: 90,
    catchCount: 1,
    createdAt: '2026-10-01',
  };
  vi.mocked(api.lure).mockResolvedValue(lure);
  vi.mocked(api.lures).mockResolvedValue({ data: [lure], total: 1, page: 1, pages: 1 });
  vi.mocked(data).mockResolvedValue(catchRecord);
  const user = userEvent.setup();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/edit']}>
        <Routes>
          <Route
            path="/edit"
            element={
              <RecordForm
                kind="catch"
                initial={{ ...catchRecord, weightKg: empty, lengthCm: empty }}
              />
            }
          />
          <Route
            path={`/catches/${catchRecord._id}`}
            element={<p>Crop saved without measurements</p>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  expect(screen.getByLabelText(/Fish weight/)).toHaveValue(null);
  if (empty === null) {
    fireEvent.change(screen.getByLabelText(/Date & time \(local\)/), {
      target: { value: '2026-07-15T14:30' },
    });
  }
  await user.click(screen.getByRole('button', { name: 'Adjust preview' }));
  fireEvent.change(screen.getByLabelText('Vertical position'), { target: { value: '25' } });
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Crop saved without measurements');
  const saved = JSON.parse(String(vi.mocked(data).mock.calls[0][1]?.body));
  expect(saved.weightKg == null).toBe(true);
  expect(saved.lengthCm == null).toBe(true);
  expect(saved.photoPosition).toEqual({ x: 20, y: 25 });
  expect(saved.caughtAt).toBe(
    empty === null ? new Date('2026-07-15T14:30').toISOString() : catchRecord.caughtAt,
  );
  if (empty === null && process.env.TZ === 'Europe/Warsaw') {
    expect(saved.caughtAt).toBe('2026-07-15T12:30:00.000Z');
  }
  unmount();
  client.clear();
});
