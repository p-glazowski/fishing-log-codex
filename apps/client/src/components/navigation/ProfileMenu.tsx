import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Settings } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@lurelog/shared';
import { data, errorMessage } from '../../lib/api';
import { t, useTranslation } from '../../lib/i18n';

export function ProfileMenu({ user }: { user: User }) {
  useTranslation();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const client = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  async function logout() {
    try {
      await data('/auth/logout', { method: 'POST' });
      client.setQueryData(['session'], null);
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      navigate('/login');
    } catch (error) {
      toast.error(t(errorMessage(error)));
    }
  }

  return (
    <div className="profile-menu" ref={container}>
      <button
        ref={trigger}
        className="profile-menu-trigger"
        aria-label={t('Your profile, {{name}}', { name: user.name })}
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen(!open)}
      >
        <span className="avatar">
          {user.avatar ? <img src={user.avatar.url} alt="" /> : user.name.slice(0, 1).toUpperCase()}
        </span>
      </button>
      {open && (
        <div id="profile-menu" className="profile-menu-panel">
          <div className="profile-menu-name">{user.name}</div>
          <Link to="/profile" onClick={() => setOpen(false)}>
            <Settings size={18} />
            {t('Account settings')}
          </Link>
          <button onClick={logout}>
            <LogOut size={18} />
            {t('Sign out')}
          </button>
        </div>
      )}
    </div>
  );
}
