import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main 
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ 
          paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
          paddingTop: 'env(safe-area-inset-top)'
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
