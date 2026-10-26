import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains('dark'));
    window.addEventListener('lurelog:theme', sync);
    return () => window.removeEventListener('lurelog:theme', sync);
  }, []);
  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('lurelog-theme', next ? 'dark' : 'light');
    setDark(next);
    window.dispatchEvent(new Event('lurelog:theme'));
  }
  return (
    <button
      type="button"
      className={compact ? 'theme-toggle icon-control' : 'theme-toggle'}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} appearance`}
      onClick={toggle}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
      <span className={compact ? 'sr-only' : ''}>{dark ? 'Light' : 'Dark'} appearance</span>
    </button>
  );
}
