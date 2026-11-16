export async function Footer() {
  'use cache';
  const buildYear = new Date().getFullYear();
  return (
    <footer className="mono flex flex-wrap justify-between gap-4 pt-24 text-[13px] tracking-[.04em] text-[#86868b]">
      <span>© {buildYear} Mohan Dong · Share with attribution</span>
    </footer>
  );
}
