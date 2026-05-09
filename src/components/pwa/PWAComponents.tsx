'use client'

import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Wifi, WifiOff } from 'lucide-react'
import { usePWAInstall, useOnlineStatus } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const { isInstallable, install, dismiss } = usePWAInstall()
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (!isInstallable) {
      setShowPrompt(false)
      return
    }

    // Cek apakah pernah di-dismiss dalam 7 hari terakhir
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) {
        setShowPrompt(false)
        return
      }
    }

    // Delay showing prompt
    const timer = setTimeout(() => {
      setShowPrompt(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isInstallable])

  const handleDismiss = () => {
    dismiss()
    setShowPrompt(false)
  }

  const handleInstall = async () => {
    await install()
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-6 h-6 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">Install Aplikasi</h3>
            <button 
              onClick={handleDismiss}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Install Open PO Management di perangkat Anda untuk akses lebih cepat dan fitur offline.
          </p>
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Download size={16} />
            Install Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

// Component untuk offline indicator
export function OfflineIndicator() {
  const { isOnline, showOfflineToast, setShowOfflineToast } = useOnlineStatus()

  useEffect(() => {
    if (showOfflineToast) {
      const timer = setTimeout(() => {
        setShowOfflineToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showOfflineToast, setShowOfflineToast])

  return (
    <>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 px-4 z-50 text-sm font-medium">
          <span className="inline-flex items-center gap-2">
            <WifiOff className="w-4 h-4" />
            Anda sedang offline. Beberapa fitur mungkin tidak tersedia.
          </span>
        </div>
      )}
      
      {showOfflineToast && isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm font-medium animate-bounce">
          <span className="inline-flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Koneksi kembali online!
          </span>
        </div>
      )}
    </>
  )
}

export default PWAInstallPrompt
