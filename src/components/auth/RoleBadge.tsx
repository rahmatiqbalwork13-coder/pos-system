'use client'

import { useAuth } from '@/hooks/useAuth'

const roleColors = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  kasir: 'bg-green-100 text-green-700',
}

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  kasir: 'Kasir',
}

export function RoleBadge() {
  const { role } = useAuth()

  if (!role) return null

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${roleColors[role]}`}>
      {roleLabels[role]}
    </span>
  )
}

export default RoleBadge
