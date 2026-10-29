import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PasswordRecovery from './PasswordRecovery';
import { data } from '../lib/api';
vi.mock('../lib/api', async (original) => ({
  ...(await original<typeof import('../lib/api')>()),
  data: vi.fn().mockResolvedValue({}),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it('validates the email and displays the generic confirmation', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <PasswordRecovery />
    </MemoryRouter>,
  );
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));
  expect(data).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Email address'), 'angler@example.com');
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));
  expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
  expect(data).toHaveBeenCalledWith(
    '/auth/forgot-password',
    expect.objectContaining({ method: 'POST' }),
  );
});
it('submits a valid new password and link token', async () => {
  const user = userEvent.setup();
  const token = 'a'.repeat(64);
  render(
    <MemoryRouter initialEntries={[`/reset-password#${token}`]}>
      <PasswordRecovery reset />
    </MemoryRouter>,
  );
  await user.type(screen.getByLabelText('New password'), 'new-password-123');
  await user.click(screen.getByRole('button', { name: 'Reset password' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Your password has been reset');
  expect(data).toHaveBeenCalledWith(
    '/auth/reset-password',
    expect.objectContaining({ body: JSON.stringify({ token, password: 'new-password-123' }) }),
  );
});
