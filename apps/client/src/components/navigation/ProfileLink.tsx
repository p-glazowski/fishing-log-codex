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
  const avatar = (
    <span className="avatar">
      {user.avatar ? <img src={user.avatar.url} alt="" /> : user.name.slice(0, 1).toUpperCase()}
    </span>
  );
  return (
    <Link
      to="/profile"
      className={`profile-link ${compact ? 'profile-link-compact' : ''}`}
      aria-label={`Your profile, ${user.name}`}
    >
      {!avatarLast && avatar}
      <span className="profile-name">{user.name}</span>
      {avatarLast && avatar}
    </Link>
  );
}
