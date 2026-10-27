import { useRef, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@lurelog/shared';
import { useTranslation } from '../../lib/i18n';
import { data, errorMessage } from '../../lib/api';

export function ProfileMenu({
  user,
  compact = false,
  avatarLast = false,
}: {
  user: User;
  compact?: boolean;
  avatarLast?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const leaving = useRef(false);
  const client = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: () => data('/auth/logout', { method: 'POST' }),
    onSuccess: async () => {
      await client.cancelQueries();
      leaving.current = true;
      setOpen(false);
      client.setQueryData(['session'], null);
      client.removeQueries({ predicate: (query) => query.queryKey[0] !== 'session' });
      navigate('/login', { replace: true });
    },
    onError: (error) => toast.error(t(errorMessage(error))),
  });
  const avatar = (
    <span className="avatar">
      {user.avatar ? <img src={user.avatar.url} alt="" /> : user.name.slice(0, 1).toUpperCase()}
    </span>
  );
  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`profile-link profile-menu-trigger ${compact ? 'profile-link-compact' : ''}`}
          aria-label={t('Your profile, {{name}}', { name: user.name })}
          disabled={logout.isPending}
        >
          {!avatarLast && avatar}
          <span className="profile-name">{user.name}</span>
          {avatarLast && avatar}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <nav aria-label={t('Account menu')}>
          <DropdownMenu.Content
            className="profile-menu"
            align="end"
            sideOffset={8}
            collisionPadding={16}
            aria-label={t('Account menu')}
            aria-labelledby={undefined}
            aria-busy={logout.isPending}
            onCloseAutoFocus={(event) => {
              if (leaving.current) {
                event.preventDefault();
                leaving.current = false;
              }
            }}
          >
            <DropdownMenu.Label className="profile-menu-identity">
              <strong>{user.name}</strong>
              <span>{t('Your fishing log')}</span>
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="profile-menu-separator" />
            <DropdownMenu.Item
              asChild
              disabled={logout.isPending}
              onSelect={() => {
                leaving.current = true;
              }}
            >
              <Link to="/profile" className="profile-menu-item">
                <Settings size={18} aria-hidden="true" />
                {t('Account settings')}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="profile-menu-item"
              disabled={logout.isPending}
              onSelect={(event) => {
                event.preventDefault();
                logout.mutate();
              }}
            >
              <LogOut size={18} aria-hidden="true" />
              {t(logout.isPending ? 'Signing out…' : 'Sign out')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </nav>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
