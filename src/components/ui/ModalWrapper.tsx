'use client'

import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
  onClose: () => void
  maxWidth?: string
  fullHeight?: boolean
}

export default function ModalWrapper({ children, onClose, maxWidth = 'md:max-w-lg', fullHeight = false }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 transition-colors duration-200 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
      onClick={handleBackdrop}
    >
      <div
        className={`bg-white w-full ${maxWidth} ${fullHeight ? 'max-h-[95vh]' : 'max-h-[95vh]'} flex flex-col
          rounded-t-2xl md:rounded-2xl overflow-hidden
          transition-transform duration-300 ease-out
          ${visible ? 'translate-y-0 md:scale-100 md:opacity-100' : 'translate-y-full md:translate-y-0 md:scale-95 md:opacity-0'}`}
      >
        {children}
      </div>
    </div>
  )
}
