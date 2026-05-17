'use client'

import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Ya, Hapus', cancelLabel = 'Batal',
  destructive = true, onConfirm, onCancel,
}: Props) {
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-[fade-in_0.15s_ease]" />
        <AlertDialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white rounded-2xl p-6 shadow-xl data-[state=open]:animate-[zoom-in_0.15s_ease]">
          <div className="flex items-start gap-4">
            {destructive && (
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
            )}
            <div className="flex-1">
              <AlertDialog.Title className="text-base font-semibold text-gray-900 mb-1">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-500">
                {description}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <AlertDialog.Cancel asChild>
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                  destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
