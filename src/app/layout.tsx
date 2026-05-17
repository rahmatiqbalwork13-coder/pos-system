import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { AuthProvider } from '@/hooks/useAuth'
import { PWAInstallPrompt, OfflineIndicator } from '@/components/pwa/PWAComponents'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Open PO Management',
  description: 'Sistem Manajemen Open PO - Kebab, Roti Maryam, Donat',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Open PO',
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Open PO Management" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Open PO" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#f97316" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Theme Color for different platforms */}
        <meta name="theme-color" content="#f97316" />
        <meta name="theme-color" content="#f97316" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#c2410c" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>
          <AuthProvider>
            <OfflineIndicator />
            {children}
            <PWAInstallPrompt />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
