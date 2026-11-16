import { Button } from '@/components/ui/button';

export function HowTo() {
  return (
    <div className="pin">
      <div className="flex flex-[1_1_360px] flex-col gap-6">
        <p className="lede">
          Turn a plain-English request into a shell command on your prompt.
        </p>
        <p className="mono m-0 text-[13px] tracking-[.06em] text-[#86868b]">
          ZSH · BASH · HOMEBREW · GPL-3.0
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="pill">
            <a href="https://github.com/powersagitar/how-to">Source ↗</a>
          </Button>
          <Button asChild variant="pill">
            <a href="https://github.com/powersagitar/homebrew-tap">
              Homebrew tap ↗
            </a>
          </Button>
        </div>
      </div>
      <pre className="code mono flex-[1_1_440px]">
        <span className="text-[#86868b]"># install</span>
        {'\nbrew install powersagitar/tap/how-to\n'}
        <span className="text-[#86868b]"># then, in ~/.zshrc</span>
        {'\nsource /opt/homebrew/opt/how-to/share/how-to/how-to.zsh\n\n'}
        <span className="text-[#86868b]">❯</span>
        {' how-to '}
        <span className="text-[#86868b]">&lt;plain-English request&gt;</span>
      </pre>
    </div>
  );
}
