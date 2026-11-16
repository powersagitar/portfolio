import type { Metadata } from 'next';
import {
  Geist_Mono,
  Inter,
  JetBrains_Mono,
  Space_Grotesk,
} from 'next/font/google';

import { Analytics } from '@vercel/analytics/next';

import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['500', '600'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['500', '600'],
});

const description = 'Software Engineering, University of Waterloo.';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mohandong.com'),
  title: { template: '%s — Mohan Dong', default: 'Mohan Dong' },
  description,
  openGraph: {
    type: 'website',
    siteName: 'Mohan Dong',
    title: 'Mohan Dong',
    description,
  },
  twitter: { card: 'summary', title: 'Mohan Dong', description },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
