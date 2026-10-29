import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CatchCard } from './RecordCards';
const lure = {
  _id: 'lure',
  name: 'Aglia',
  brand: 'Mepps',
  type: 'Spinner' as const,
  lengthMm: 45,
  catchCount: 1,
  createdAt: '2026-10-01',
};
afterEach(cleanup);
function mount() {
  render(
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <CatchCard
              recent
              item={{
                _id: 'fish',
                lureId: lure,
                species: 'Trout',
                caughtAt: '2026-10-01T08:00:00Z',
                createdAt: '2026-10-01',
              }}
            />
          }
        />
        <Route path="/lures/lure" element={<h1>Lure details</h1>} />
        <Route path="/catches/fish" element={<h1>Catch details</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}
it('opens the lure from a Recent catches row without the row overriding navigation', async () => {
  mount();
  const user = userEvent.setup();
  await user.click(screen.getByRole('link', { name: 'Mepps Aglia 45 mm' }));
  expect(screen.getByRole('heading', { name: 'Lure details' })).toBeVisible();
});
it('retains native keyboard navigation to the catch', async () => {
  mount();
  const user = userEvent.setup();
  screen.getByRole('link', { name: 'Trout' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: 'Catch details' })).toBeVisible();
});
