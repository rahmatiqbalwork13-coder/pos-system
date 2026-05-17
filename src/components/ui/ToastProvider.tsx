'use client'

import { useState, useCallback } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { ToastContext, type ToastItem, type ToastType } from '@/hooks/useToast'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const ICON_STYLES = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <RadixToast.Provider swipeDirection="right" duration={3500}>
        {children}
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <RadixToast.Root
              key={t.id}
              open
              onOpenChange={open => { if (!open) dismiss(t.id) }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg max-w-sm w-full
                data-[state=open]:animate-slide-in-right
                data-[state=closed]:animate-fade-out
                ${STYLES[t.type]}`}
            >
              <Icon size={18} className={`flex-shrink-0 ${ICON_STYLES[t.type]}`} />
              <RadixToast.Description className="flex-1 text-sm font-medium">
                {t.message}
              </RadixToast.Description>
              <RadixToast.Close asChild>
                <button className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-black/5">
                  <X size={20} />
                </button>
              </RadixToast.Close>
            </RadixToast.Root>
          )
        })}
        <RadixToast.Viewport className="fixed bottom-24 md:bottom-6 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}
