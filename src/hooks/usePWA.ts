'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }

  const dismiss = () => {
    setIsInstallable(false)
    // Simpan ke localStorage agar tidak muncul lagi dalam waktu tertentu
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  return { isInstallable, isInstalled, install, dismiss }
}

// Hook untuk mengelola status online/offline
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineToast, setShowOfflineToast] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineToast(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineToast(true)
    }

    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, showOfflineToast, setShowOfflineToast }
}

// Hook untuk haptic feedback
export function useHaptic() {
  const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  }

  const lightImpact = () => vibrate(5)
  const mediumImpact = () => vibrate(10)
  const heavyImpact = () => vibrate(15)
  const success = () => vibrate([10, 50, 10])
  const error = () => vibrate([20, 30, 20])
  const warning = () => vibrate(20)

  return { vibrate, lightImpact, mediumImpact, heavyImpact, success, error, warning }
}

// Hook untuk pull-to-refresh
interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>
  threshold?: number
  disabled?: boolean
}

export function usePullToRefresh({ onRefresh, threshold = 100, disabled = false }: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scroll
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY
        currentY.current = e.touches[0].clientY
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return
      
      currentY.current = e.touches[0].clientY
      const diff = currentY.current - startY.current
      
      // Only allow pulling down
      if (diff > 0) {
        // Apply resistance (dampening)
        const dampened = Math.pow(diff, 0.7)
        setPullDistance(Math.min(dampened, threshold * 1.5))
        
        // Prevent default scrolling behavior
        if (diff > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return
      
      setIsPulling(false)
      
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(threshold * 0.5) // Keep showing spinner
        
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh, threshold, disabled])

  return { 
    containerRef, 
    isPulling, 
    pullDistance, 
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1)
  }
}

export default usePWAInstall
