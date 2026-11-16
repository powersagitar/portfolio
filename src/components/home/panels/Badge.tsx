import { Button } from '@/components/ui/button';

export function Badge() {
  return (
    <div className="pin">
      <div className="htb">
        <div className="flex max-w-[620px] flex-col gap-[14px]">
          <span className="font-quill text-[11px] leading-none font-semibold tracking-[.14em] text-[#c9a7dc]">
            HACK THE NORTH 2026 · UNOFFICIAL
          </span>
          <h2 className="m-0 text-[clamp(34px,4.4vw,60px)] leading-none font-semibold tracking-[-0.02em]">
            Badge Emulator<span className="text-[#b07ccb]">.</span>
          </h2>
          <p className="m-0 text-[18px] leading-[1.5] text-[#bdbdbd]">
            An emulator for the Hack the North 2026 badge that runs the real
            firmware, on a badge that hangs from a lanyard you can drag and
            fling. Not affiliated with Hack the North.
          </p>
          <span className="font-quill text-[12px] leading-none font-medium tracking-[.06em] text-[#8a8a8a]">
            RUST · GPL-3.0
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="htb" on>
            <a href="https://hack-the-badge.mohandong.com">Open emulator ↗</a>
          </Button>
          <Button asChild variant="htb">
            <a href="https://github.com/powersagitar/hack-the-badge">
              Source ↗
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
