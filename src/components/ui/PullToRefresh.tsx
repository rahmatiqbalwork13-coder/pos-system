'use client'

import { usePullToRefresh } from '@/hooks/usePWA'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function PullToRefresh({ onRefresh, children, className = '', disabled = false }: PullToRefreshProps) {
  const { containerRef, pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh,
    threshold: 100,
    disabled,
  })

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-y-auto ${className}`}
      style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ 
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            transition: isRefreshing ? 'height 0.2s ease' : 'none'
          }}
        >
          <div 
            className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-md transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${progress * 360}deg)`,
              opacity: Math.min(progress + 0.2, 1)
            }}
          >
            <RefreshCw size={20} className="text-orange-500" />
          </div>
        </div>
      )}
      
      {/* Content with padding for pull indicator */}
      <div style={{ 
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing ? 'transform 0.2s ease' : 'none'
      }}>
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh
