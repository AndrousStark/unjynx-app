import type { Metadata, Viewport } from 'next';
import { Outfit, DM_Sans, Bebas_Neue } from 'next/font/google';
import { Providers } from '@/lib/providers';
import { ThemeProvider } from '@/components/providers/theme-provider';
import '@/styles/globals.css';

// ─── Fonts ───────────────────────────────────────────────────────

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
  weight: '400',
});

// ─── Metadata ────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: 'UNJYNX — Break the Satisfactory',
    template: '%s | UNJYNX',
  },
  description:
    'Unjynx your productivity. Premium task management with social media reminders, AI intelligence, and enterprise collaboration.',
  keywords: [
    'productivity',
    'todo',
    'reminders',
    'whatsapp reminders',
    'task management',
    'unjynx',
    'metaminds',
  ],
  authors: [{ name: 'METAminds', url: 'https://unjynx.me' }],
  creator: 'METAminds',
  metadataBase: new URL('https://app.unjynx.me'),
  openGraph: {
    type: 'website',
    siteName: 'UNJYNX',
    title: 'UNJYNX — Break the Satisfactory',
    description:
      'Premium task management with social media reminders, AI intelligence, and enterprise collaboration.',
    url: 'https://app.unjynx.me',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNJYNX — Break the Satisfactory',
    description:
      'Premium task management with social media reminders, AI intelligence, and enterprise collaboration.',
  },
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F0A1A' },
    { media: '(prefers-color-scheme: light)', color: '#F8F5FF' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// ─── Root Layout ─────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${dmSans.variable} ${bebasNeue.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-dm-sans antialiased">
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
