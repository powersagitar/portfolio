import Link from 'next/link';

type NextPostProps = {
  index: number;
  total: number;
  title: string;
  href: string;
};

export function NextPost({ index, total, title, href }: NextPostProps) {
  return (
    <nav aria-label="Next post" className="mx-auto mt-30 max-w-[1040px]">
      <p className="mono m-0 mb-3 text-xs tracking-[.08em] text-[#86868b] uppercase">
        Next
      </p>
      <Link className="next-post" href={href}>
        <span className="n mono text-sm text-[#86868b]">
          {index}/{total}
        </span>
        <span className="t">{title}</span>
        <span aria-hidden="true" className="text-2xl text-[#86868b]">
          →
        </span>
      </Link>
    </nav>
  );
}
