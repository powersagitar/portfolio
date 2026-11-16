import type { ReactNode } from 'react';

type CalloutProps = {
  type?: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  children: ReactNode;
};

export function Callout({ type = 'note', children }: CalloutProps) {
  return (
    <aside className="my-7 rounded-[14px] border border-[#2c2c2e] bg-[#0d0d0d] px-[22px] py-5">
      <p className="mono mb-2 text-xs tracking-[.08em] text-[#86868b] uppercase">
        {type}
      </p>
      {children}
    </aside>
  );
}
