import { Button } from '@/components/ui/button';

export function Spaces() {
  return (
    <div className="pin">
      <div className="flex flex-[1_1_360px] flex-col gap-6">
        <p className="lede">
          A tiny macOS menu bar app that shows each display&apos;s current Space
          as a number.
        </p>
        <p className="mono m-0 text-[13px] tracking-[.06em] text-[#86868b]">
          SWIFT · MACOS · HOMEBREW · GPL-3.0
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="pill">
            <a href="https://github.com/powersagitar/space-indicator">
              Source ↗
            </a>
          </Button>
          <Button asChild variant="pill">
            <a href="https://github.com/powersagitar/homebrew-tap">
              Homebrew Tap ↗
            </a>
          </Button>
        </div>
      </div>
      <pre className="code mono flex-[1_1_440px]">
        <span className="text-[#86868b]"># install</span>
        {'\nbrew install powersagitar/tap/space-indicator\n'}
        {
          'ln -sfn "$(brew --prefix)/opt/space-indicator/Space Indicator.app" \\\n  "/Applications/Space Indicator.app"\n'
        }
        {'open "/Applications/Space Indicator.app"'}
      </pre>
    </div>
  );
}
