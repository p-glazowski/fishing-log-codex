import { Link } from 'react-router-dom';
import { Fish } from 'lucide-react';
export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="LureLog home">
      <span className="logo-mark">
        <Fish size={24} aria-hidden="true" />
      </span>
      <span>
        Lure<span className="logo-light">Log</span>
      </span>
      <span className="logo-edition" aria-hidden="true">
        FIELD JOURNAL
      </span>
    </Link>
  );
}
