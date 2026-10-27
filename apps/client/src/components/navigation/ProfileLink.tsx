import { t, useTranslation } from '../../lib/i18n';
import { Link } from 'react-router-dom';
import type { User } from '@lurelog/shared';
export function ProfileLink({
  user,
  compact = false,
  avatarLast = false,
}: {
  user: User;
  compact?: boolean;
  avatarLast?: boolean;
}) {
  useTranslation();
  const avatar = (
    <span className="avatar">
      {user.avatar ? <img src={user.avatar.url} alt="" /> : user.name.slice(0, 1).toUpperCase()}
    </span>
  );
  return (
    <Link
      to="/profile"
      className={`profile-link ${compact ? 'profile-link-compact' : ''}`}
      aria-label={t('Your profile, {{name}}', { name: user.name })}
    >
      {!avatarLast && avatar}
      <span className="profile-name">{user.name}</span>
      {avatarLast && avatar}
    </Link>
  );
}
