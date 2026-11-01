import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: { default: 'A.N.X — Club & Member Ecosystem', template: '%s | A.N.X' },
  description: 'A premium platform for student clubs — events, mentorship, and community all in one place.',
  keywords: ['student club', 'mentorship', 'events', 'networking', 'college'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
