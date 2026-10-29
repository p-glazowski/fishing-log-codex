import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Auth from './Auth';
vi.mock('../lib/auth', () => ({ useAuth: () => ({ user: null }) }));
afterEach(cleanup);
it('uses plain errors, clears them between account forms, and toggles password visibility', async () => {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(await screen.findByText('Enter your password')).toBeVisible();
  expect(screen.getByLabelText('Email address')).toHaveFocus();
  expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
  await user.click(screen.getByRole('link', { name: 'Create an account' }));
  expect(screen.queryByText('Enter your password')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Create your free account' }));
  expect(await screen.findByText('Enter at least 2 characters for your name')).toBeVisible();
  expect(screen.getByLabelText('Your name')).toHaveFocus();
  await user.type(screen.getByLabelText('Password'), 'a-test-password');
  await user.click(screen.getByRole('button', { name: 'Show Password' }));
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  await user.click(screen.getByRole('button', { name: 'Hide Password' }));
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  client.clear();
});
