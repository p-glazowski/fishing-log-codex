import type { ComponentPropsWithRef } from 'react';
import { ChevronDown } from 'lucide-react';

export function FilterSelect(props: ComponentPropsWithRef<'select'>) {
  return (
    <span className="filter-select">
      <select {...props} />
      <ChevronDown size={16} aria-hidden="true" />
    </span>
  );
}
