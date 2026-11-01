'use client'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'react-hot-toast'

import { QueryProvider } from '@/providers/QueryProvider'
import { AuthProvider } from "@/modules/module3/components/AuthContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" enableSystem={false} disableTransitionOnChange>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '14px' },
              success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
              error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
