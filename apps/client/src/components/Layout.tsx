import { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Fish,
  BookOpen,
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
  Compass,
  ArrowUpRight,
  Menu,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';
import { data, errorMessage } from '../lib/api';
export function Logo() {
  return (
    <Link className="logo" to="/">
      <span className="logo-mark">
        <Fish size={25} />
      </span>
      Lure<span>Log</span>
      <i />
    </Link>
  );
}
const nav = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/lures', 'Lure collection', Fish],
  ['/catches', 'Fishing journal', BookOpen],
] as const;
export default function Layout() {
  const { user } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  function theme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('lurelog-theme', next ? 'dark' : 'light');
  }
  async function logout() {
    try {
      await data('/auth/logout', { method: 'POST' });
      client.setQueryData(['session'], null);
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      navigate('/login');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <Logo />
          <button
            className="mobile-close"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <span className="nav-label">YOUR FISHING SPACE</span>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-tip">
          <Compass size={27} />
          <h3>
            Good days start
            <br />
            with a little preparation.
          </h3>
          <p>Your next great catch is out there.</p>
          <Link to="/lures/new">
            Get your tackle ready <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/profile" onClick={() => setOpen(false)}>
            <Settings size={19} />
            Account settings
          </NavLink>
          <button onClick={theme}>
            {dark ? <Sun size={19} /> : <Moon size={19} />} {dark ? 'Light' : 'Dark'} appearance
          </button>
          <button onClick={logout}>
            <LogOut size={19} />
            Sign out
          </button>
          <Link to="/profile" className="profile-mini">
            <span className="avatar">
              {user?.avatar ? <img src={user.avatar.url} alt="" /> : user?.name.slice(0, 1)}
            </span>
            <div>
              <strong>{user?.name}</strong>
              <small>Your personal fishing log</small>
            </div>
          </Link>
        </div>
      </aside>
      {open && <div className="mobile-shade" onClick={() => setOpen(false)} />}
      <div className="main-wrap">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <span>MY FISHING SPACE</span>
            <span className="breadcrumb-divider">/</span>
            <strong>LureLog</strong>
          </div>
          <div className="topbar-right">
            <span className="live-dot" /> Make every cast count{' '}
            <Link to="/profile" className="avatar avatar-small">
              {user?.name.slice(0, 1)}
            </Link>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Made for the moments on the water.</span>
          <span>
            LureLog <Fish size={14} />
          </span>
        </footer>
      </div>
      <nav className="bottom-nav">
        {nav.map(([to, label, Icon]) => (
          <NavLink to={to} key={to}>
            <Icon size={21} />
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
          <Plus size={21} />
          <span>Log catch</span>
        </NavLink>
      </nav>
    </div>
  );
}
