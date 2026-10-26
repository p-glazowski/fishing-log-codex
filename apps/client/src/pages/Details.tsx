import { LureDetails } from './details/LureDetails';
import { CatchDetails } from './details/CatchDetails';
export default function Details({ kind }: { kind: 'lure' | 'catch' }) {
  return kind === 'lure' ? <LureDetails /> : <CatchDetails />;
}
