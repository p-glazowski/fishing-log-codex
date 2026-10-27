import { t, useTranslation } from '../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { SidebarContent, mainNavigation } from './navigation/SidebarContent';
import { ProfileLink } from './navigation/ProfileLink';
export { Logo } from './branding/Logo';
export default function Layout() {
  useTranslation();

  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);
  const section = location.pathname.startsWith('/lures')
    ? t('Lure collection')
    : location.pathname.startsWith('/catches')
      ? t('Fishing journal')
      : location.pathname === '/profile'
        ? t('Account settings')
        : t('Overview');
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {t('Skip to content')}
      </a>
      <aside className="sidebar">
        <SidebarContent />
      </aside>
      <dialog
        ref={dialog}
        id="workspace-navigation"
        className="mobile-drawer"
        aria-label={t('Workspace navigation')}
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <button
          className="drawer-close icon-control"
          aria-label={t('Close navigation')}
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </dialog>
      <div className="main-wrap">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-control"
              aria-label={t('Open navigation')}
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <Link to="/dashboard">{t('Workspace')}</Link>
            <ChevronRight size={14} />
            <span>{t(section)}</span>
          </div>
          <div className="topbar-right">
            <Link className="topbar-log text-action" to="/catches/new">
              <Plus size={16} />
              {t('Log a catch')}
            </Link>
            {user && <ProfileLink user={user} compact />}
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>{t('LureLog — your personal fishing journal.')}</span>
          <span>{t('Private by default.')}</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label={t('Mobile navigation')}>
        {mainNavigation.map(([to, label, Icon]) => (
          <NavLink to={to} key={to} end={to === '/catches' && location.pathname === '/catches/new'}>
            <Icon size={20} />
            <span>
              {label === 'Lure collection'
                ? t('Collection')
                : label === 'Fishing journal'
                  ? t('Journal')
                  : t(label)}
            </span>
          </NavLink>
        ))}
        <NavLink to="/catches/new">
          <Plus size={20} />
          <span>{t('Log catch')}</span>
        </NavLink>
      </nav>
    </div>
  );
}
