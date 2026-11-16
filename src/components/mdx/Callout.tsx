import type { ReactNode } from 'react';

type CalloutProps = {
  type?: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  children: ReactNode;
};

export function Callout({ type = 'note', children }: CalloutProps) {
  return (
    <aside className="my-7 rounded-[14px] border border-[#2c2c2e] px-[22px] py-5 text-[17px]">
      <p className="mono callout-label text-[11px] tracking-[.08em] text-[#86868b] uppercase">
        {type}
      </p>
      {children}
    </aside>
  );
}
