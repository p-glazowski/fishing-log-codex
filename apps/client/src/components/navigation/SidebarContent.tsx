import { t, useTranslation } from '../../lib/i18n';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Fish, BookOpen, Plus, ArrowUpRight } from 'lucide-react';
import { Logo } from '../branding/Logo';
import { Button } from '../ui/button';
export const mainNavigation = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/lures', 'Lure collection', Fish],
  ['/catches', 'Fishing journal', BookOpen],
] as const;
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  useTranslation();

  return (
    <div className="sidebar-content">
      <div className="sidebar-logo">
        <Logo />
      </div>
      <div className="sidebar-intro">
        <span className="nav-label">{t('YOUR FISHING CORNER')}</span>
        <span className="private-label">{t('Lures, catches & memories')}</span>
      </div>
      <nav aria-label={t('Main navigation')}>
        {mainNavigation.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} onClick={onNavigate}>
            <Icon size={20} />
            {t(label)}
            <ArrowUpRight size={16} className="nav-arrow" />
          </NavLink>
        ))}
      </nav>
      <Button asChild className="sidebar-add">
        <Link to="/lures/new" onClick={onNavigate}>
          <Plus size={18} />
          {t('Add a lure')}
        </Link>
      </Button>
    </div>
  );
}
