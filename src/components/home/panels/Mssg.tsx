import { Button } from '@/components/ui/button';

export function Mssg() {
  return (
    <div className="pin">
      <div className="flex flex-[1_1_360px] flex-col gap-6">
        <p className="lede">A minimal static site generator.</p>
        <p className="mono m-0 text-[13px] tracking-[.06em] text-[#86868b]">
          TYPESCRIPT
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="pill">
            <a href="https://github.com/powersagitar/mssg">Source ↗</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
