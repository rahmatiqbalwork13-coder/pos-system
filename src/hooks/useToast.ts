'use client'

import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

export interface ToastContextType {
  toasts: ToastItem[]
  toast: (message: string, type?: ToastType) => void
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
