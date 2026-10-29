import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { UnsavedChangesProvider, useUnsavedChanges } from './UnsavedChanges';
afterEach(cleanup);
function Entry() {
  const [note, setNote] = useState('');
  const allow = useUnsavedChanges(!!note);
  const navigate = useNavigate();
  return (
    <>
      <label>
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <Link to="/journal">Journal</Link>
      <button
        onClick={() => {
          allow();
          navigate('/journal');
        }}
      >
        Save
      </button>
    </>
  );
}
function mount() {
  const router = createMemoryRouter([
    {
      element: (
        <UnsavedChangesProvider>
          <Outlet />
        </UnsavedChangesProvider>
      ),
      children: [
        { path: '/', element: <Entry /> },
        { path: '/journal', element: <h1>Journal screen</h1> },
      ],
    },
  ]);
  render(<RouterProvider router={router} />);
  return router;
}
it('keeps entered data when navigation is cancelled and leaves only after discarding', async () => {
  mount();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Note'), 'Keep this catch');
  await user.click(screen.getByRole('link', { name: 'Journal' }));
  expect(await screen.findByRole('alertdialog')).toHaveTextContent('Leave without saving?');
  await user.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Note')).toHaveValue('Keep this catch');
  await user.click(screen.getByRole('link', { name: 'Journal' }));
  await user.click(screen.getByRole('button', { name: 'Discard changes' }));
  expect(screen.getByRole('heading', { name: 'Journal screen' })).toBeVisible();
});
it('warns on reload while dirty and allows a completed save to navigate', async () => {
  mount();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Note'), 'A catch');
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'Journal screen' })).toBeVisible(),
  );
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});
