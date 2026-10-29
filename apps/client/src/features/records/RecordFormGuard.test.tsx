import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, Link, Outlet } from 'react-router-dom';
import { UnsavedChangesProvider } from '../../components/navigation/UnsavedChanges';
import { RecordForm } from './RecordForm';
afterEach(cleanup);
it('allows leaving a blank form but protects an actual user edit', async () => {
  const client = new QueryClient();
  const router = createMemoryRouter(
    [
      {
        element: (
          <UnsavedChangesProvider>
            <Outlet />
          </UnsavedChangesProvider>
        ),
        children: [
          {
            path: '/new',
            element: (
              <>
                <Link to="/journal">Journal</Link>
                <RecordForm kind="lure" />
              </>
            ),
          },
          {
            path: '/journal',
            element: (
              <>
                <h1>Journal screen</h1>
                <Link to="/new">New lure</Link>
              </>
            ),
          },
        ],
      },
    ],
    { initialEntries: ['/new'] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('link', { name: 'Journal' }));
  expect(screen.getByRole('heading', { name: 'Journal screen' })).toBeVisible();
  await user.click(screen.getByRole('link', { name: 'New lure' }));
  await user.type(screen.getByLabelText(/Model \/ name/), 'Aglia');
  await user.click(screen.getByRole('link', { name: 'Journal' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Leave without saving?');
  await user.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText(/Model \/ name/)).toHaveValue('Aglia');
  client.clear();
  router.dispose();
});
