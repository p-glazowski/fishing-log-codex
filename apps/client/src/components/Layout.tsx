import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { SidebarContent, mainNavigation } from './navigation/SidebarContent';
import { ProfileLink } from './navigation/ProfileLink';
export { Logo } from './branding/Logo';
export default function Layout() {
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
    ? 'Lure collection'
    : location.pathname.startsWith('/catches')
      ? 'Fishing journal'
      : location.pathname === '/profile'
        ? 'Account settings'
        : 'Overview';
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <SidebarContent />
      </aside>
      <dialog
        ref={dialog}
        id="workspace-navigation"
        className="mobile-drawer"
        aria-label="Workspace navigation"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <button
          className="drawer-close icon-control"
          aria-label="Close navigation"
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
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="workspace-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <Link to="/dashboard">Workspace</Link>
            <ChevronRight size={14} />
            <span>{section}</span>
          </div>
          <div className="topbar-right">
            <Link className="topbar-log text-action" to="/catches/new">
              <Plus size={16} />
              Log a catch
            </Link>
            {user && <ProfileLink user={user} compact />}
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>LureLog — your personal fishing journal.</span>
          <span>Private by default.</span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {mainNavigation.map(([to, label, Icon]) => (
          <NavLink to={to} key={to} end={to === '/catches' && location.pathname === '/catches/new'}>
            <Icon size={20} />
            <span>
              {label === 'Lure collection'
                ? 'Collection'
                : label === 'Fishing journal'
                  ? 'Journal'
                  : label}
            </span>
          </NavLink>
        ))}
        <NavLink to="/catches/new">
          <Plus size={20} />
          <span>Log catch</span>
        </NavLink>
      </nav>
    </div>
  );
}
