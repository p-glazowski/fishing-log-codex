export function returnPath(state: unknown, fallback: string) {
  const value = (state as { returnTo?: unknown } | null)?.returnTo;
  return typeof value === 'string' && /^\/(?:lures|catches|dashboard|profile)(?:[/?]|$)/.test(value)
    ? value
    : fallback;
}
export function backLabel(path: string) {
  if (path.startsWith('/dashboard')) return 'Back to overview';
  if (/^\/lures\/[^/?]+/.test(path)) return 'Back to lure';
  if (/^\/catches\/[^/?]+/.test(path)) return 'Back to catch';
  return path.startsWith('/lures') ? 'Back to collection' : 'Back to journal';
}
