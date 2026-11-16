import type { ReactNode } from 'react';

type MetaRowProps = { left: ReactNode; right: ReactNode };

export function MetaRow({ left, right }: MetaRowProps) {
  return (
    <div className="mono flex justify-between gap-4 text-[13px] tracking-[.06em] text-[#86868b] uppercase">
      <span className="inline-flex min-h-11 items-center">{left}</span>
      <span className="inline-flex items-center">{right}</span>
    </div>
  );
}
