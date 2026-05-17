export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          is_active?: boolean
          sort_order?: number
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          current_buy_price: number
          current_sell_price: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          current_buy_price: number
          current_sell_price: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          current_buy_price?: number
          current_sell_price?: number
          image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          product_id: string
          price_type: 'buy' | 'sell'
          old_price: number
          new_price: number
          delta: number
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          price_type: 'buy' | 'sell'
          old_price: number
          new_price: number
          changed_by?: string | null
          changed_at?: string
        }
        Update: never
      }
      po_sessions: {
        Row: {
          id: string
          name: string
          open_date: string
          close_date: string
          pickup_date: string | null
          max_capacity: number | null
          status: 'draft' | 'active' | 'closed' | 'done'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          open_date: string
          close_date: string
          pickup_date?: string | null
          max_capacity?: number | null
          status?: 'draft' | 'active' | 'closed' | 'done'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          open_date?: string
          close_date?: string
          pickup_date?: string | null
          max_capacity?: number | null
          status?: 'draft' | 'active' | 'closed' | 'done'
          notes?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          session_id: string
          customer_name: string
          customer_phone: string | null
          source: 'whatsapp' | 'instagram' | 'tatap_muka'
          delivery_type: 'pickup' | 'antar_langsung' | 'gosend' | 'grabsend' | 'lainnya'
          delivery_note: string | null
          delivery_cost: number
          delivery_paid_by: 'customer' | 'seller'
          payment_status: 'unpaid' | 'dp' | 'paid'
          payment_method: string | null
          amount_paid: number
          proof_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          customer_name: string
          customer_phone?: string | null
          source: 'whatsapp' | 'instagram' | 'tatap_muka'
          delivery_type?: 'pickup' | 'antar_langsung' | 'gosend' | 'grabsend' | 'lainnya'
          delivery_note?: string | null
          delivery_cost?: number
          delivery_paid_by?: 'customer' | 'seller'
          payment_status?: 'unpaid' | 'dp' | 'paid'
          payment_method?: string | null
          amount_paid?: number
          proof_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          session_id?: string
          customer_name?: string
          customer_phone?: string | null
          source?: 'whatsapp' | 'instagram' | 'tatap_muka'
          delivery_type?: 'pickup' | 'antar_langsung' | 'gosend' | 'grabsend' | 'lainnya'
          delivery_note?: string | null
          delivery_cost?: number
          delivery_paid_by?: 'customer' | 'seller'
          payment_status?: 'unpaid' | 'dp' | 'paid'
          payment_method?: string | null
          amount_paid?: number
          proof_url?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          buy_price: number
          sell_price: number
          quantity: number
          subtotal_sell: number
          subtotal_buy: number
          profit: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          buy_price: number
          sell_price: number
          quantity: number
        }
        Update: {
          quantity?: number
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          value?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'kasir' | 'owner'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'kasir' | 'owner'
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: 'admin' | 'kasir' | 'owner'
          updated_at?: string
        }
      }
    }
  }
}

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type PriceHistory = Database['public']['Tables']['price_history']['Row']
export type PoSession = Database['public']['Tables']['po_sessions']['Row']
export type PoSessionInsert = Database['public']['Tables']['po_sessions']['Insert']
export type PoSessionUpdate = Database['public']['Tables']['po_sessions']['Update']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type Category = Database['public']['Tables']['categories']['Row']
export type UserRole = Database['public']['Tables']['user_roles']['Row']
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert']
export type UserRoleUpdate = Database['public']['Tables']['user_roles']['Update']

export type OrderWithItems = Order & { order_items: OrderItem[] }

// Role permissions
export const ROLE_PERMISSIONS = {
  owner: {
    canViewReports: true,
    canViewProfit: true,
    canManageProducts: true,
    canManageSessions: true,
    canManageOrders: true,
    canManageUsers: true,
    canExportData: true,
    canDeleteOrders: true,
  },
  admin: {
    canViewReports: true,
    canViewProfit: false,
    canManageProducts: true,
    canManageSessions: true,
    canManageOrders: true,
    canManageUsers: false,
    canExportData: true,
    canDeleteOrders: true,
  },
  kasir: {
    canViewReports: false,
    canViewProfit: false,
    canManageProducts: false,
    canManageSessions: false,
    canManageOrders: true,
    canManageUsers: false,
    canExportData: false,
    canDeleteOrders: false,
  },
} as const

export type UserRoleType = keyof typeof ROLE_PERMISSIONS
