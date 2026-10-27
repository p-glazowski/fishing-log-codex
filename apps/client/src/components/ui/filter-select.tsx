import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export function FilterSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="filter-select">
      <select {...props} />
      <ChevronDown size={16} aria-hidden="true" />
    </div>
  );
}
