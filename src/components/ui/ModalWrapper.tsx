'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  onClose: () => void
  maxWidth?: string
  fullHeight?: boolean
}

export default function ModalWrapper({ children, onClose, maxWidth = 'md:max-w-lg', fullHeight = false }: Props) {
  const [visible, setVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [translateY, setTranslateY] = useState(0)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Trigger animation after mount
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  // Handle touch start for swipe gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle swipe on the drag handle area (top part of modal)
    const target = e.target as HTMLElement
    const isHandle = target.closest('.drag-handle') || target.closest('.drag-handle-area')
    
    if (isHandle) {
      setIsDragging(true)
      startYRef.current = e.touches[0].clientY
      currentYRef.current = e.touches[0].clientY
    }
  }, [])

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    
    currentYRef.current = e.touches[0].clientY
    const diff = currentYRef.current - startYRef.current
    
    // Only allow dragging down (positive diff)
    if (diff > 0) {
      setTranslateY(diff)
    }
  }, [isDragging])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    const diff = currentYRef.current - startYRef.current
    
    // If dragged more than 100px or with velocity, close the modal
    if (diff > 100) {
      setVisible(false)
      setTimeout(onClose, 300)
    } else {
      // Reset position
      setTranslateY(0)
    }
  }, [isDragging, onClose])

  // Handle mouse events for desktop drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const isHandle = target.closest('.drag-handle') || target.closest('.drag-handle-area')
    
    if (isHandle) {
      setIsDragging(true)
      startYRef.current = e.clientY
      currentYRef.current = e.clientY
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    
    currentYRef.current = e.clientY
    const diff = currentYRef.current - startYRef.current
    
    if (diff > 0) {
      setTranslateY(diff)
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    const diff = currentYRef.current - startYRef.current
    
    if (diff > 100) {
      setVisible(false)
      setTimeout(onClose, 300)
    } else {
      setTranslateY(0)
    }
  }, [isDragging, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 transition-colors duration-200 ${visible ? 'bg-black/50' : 'bg-black/0'}`}
      onClick={handleBackdrop}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        ref={modalRef}
        className={`bg-white w-full ${maxWidth} ${fullHeight ? 'max-h-[95vh]' : 'max-h-[95vh]'} flex flex-col
          rounded-t-2xl md:rounded-2xl overflow-hidden
          transition-transform duration-300 ease-out
          ${visible ? 'md:scale-100 md:opacity-100' : 'md:scale-95 md:opacity-0'}`}
        style={{
          transform: `translateY(${visible ? translateY : '100%'})`,
          transition: isDragging ? 'none' : 'transform 300ms ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Drag handle - mobile only */}
        <div className="md:hidden drag-handle-area flex justify-center pt-3 pb-1 flex-shrink-0 cursor-grab active:cursor-grabbing">
          <div className="drag-handle w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  )
}
