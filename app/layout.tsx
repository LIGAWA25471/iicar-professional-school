import type { Metadata, Viewport } from 'next'
import { Inter, Lato } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const lato = Lato({ subsets: ['latin'], weight: ['400', '700', '900'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: 'IICAR Global College – Professional Certification',
  description:
    'Institute of International Career Advancement and Recognition — self-paced professional certification programs recognised globally.',
  icons: { icon: '/logo.jpg', apple: '/logo.jpg' },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${lato.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
