import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemePreference } from '../../lib/theme';
const choices = [
  {
    value: 'system',
    label: 'Use system settings',
    description: 'Automatically match your device’s light or dark mode.',
    Icon: Monitor,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Keep a light background, whatever your system uses.',
    Icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Keep a dark background, whatever your system uses.',
    Icon: Moon,
  },
] as const;
export function AppearanceSettings() {
  const { preference, resolved, setPreference } = useThemePreference();
  return (
    <section className="panel form-section appearance-settings" aria-labelledby="appearance-title">
      <div className="form-section-heading">
        <Monitor aria-hidden="true" />
        <div>
          <h2 id="appearance-title">Appearance</h2>
          <p>Choose how LureLog looks on this device.</p>
        </div>
      </div>
      <fieldset>
        <legend className="sr-only">Color theme</legend>
        {choices.map(({ value, label, description, Icon }) => (
          <label key={value} className="appearance-option">
            <input
              type="radio"
              name="color-theme"
              value={value}
              aria-labelledby={`theme-${value}-label`}
              aria-describedby={`theme-${value}-description`}
              checked={preference === value}
              onChange={() => setPreference(value)}
            />
            <Icon size={20} aria-hidden="true" />
            <span>
              <strong id={`theme-${value}-label`}>{label}</strong>
              <small id={`theme-${value}-description`}>{description}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="appearance-status" role="status">
        Currently using {resolved} mode.{' '}
        {preference === 'system'
          ? 'Updates automatically when your system changes.'
          : 'Your preference is saved on this device.'}
      </p>
    </section>
  );
}
