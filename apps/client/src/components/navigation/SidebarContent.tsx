import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Fish,
  BookOpen,
  Settings,
  LogOut,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../lib/auth';
import { data, errorMessage } from '../../lib/api';
import { Logo } from '../branding/Logo';
import { ThemeToggle } from './ThemeToggle';
import { ProfileLink } from './ProfileLink';
import { Button } from '../ui/button';
export const mainNavigation = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/lures', 'Lure collection', Fish],
  ['/catches', 'Fishing journal', BookOpen],
] as const;
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  async function logout() {
    try {
      await data('/auth/logout', { method: 'POST' });
      client.setQueryData(['session'], null);
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      onNavigate?.();
      navigate('/login');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }
  return (
    <div className="sidebar-content">
      <div className="sidebar-logo">
        <Logo />
      </div>
      <div className="sidebar-intro">
        <span className="nav-label">PERSONAL WORKSPACE</span>
        <span className="private-label">Private collection</span>
      </div>
      <nav aria-label="Main navigation">
        {mainNavigation.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} onClick={onNavigate}>
            <Icon size={20} />
            {label}
            <ArrowUpRight size={16} className="nav-arrow" />
          </NavLink>
        ))}
      </nav>
      <Button asChild className="sidebar-add">
        <Link to="/lures/new" onClick={onNavigate}>
          <Plus size={18} />
          Add a lure
        </Link>
      </Button>
      <div className="sidebar-bottom">
        <NavLink to="/profile" onClick={onNavigate}>
          <Settings size={18} />
          Account settings
        </NavLink>
        <ThemeToggle />
        <button onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
        {user && (
          <div className="sidebar-profile">
            <ProfileLink user={user} />
            <span>YOUR FIELD JOURNAL</span>
          </div>
        )}
      </div>
    </div>
  );
}
