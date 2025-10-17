export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          address: string
          license_number: string
          total_capacity: number
          status: 'pending' | 'approved' | 'rejected'
          registration_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          address: string
          license_number: string
          total_capacity: number
          status?: 'pending' | 'approved' | 'rejected'
          registration_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          license_number?: string
          total_capacity?: number
          status?: 'pending' | 'approved' | 'rejected'
          registration_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      delivery_partners: {
        Row: {
          id: string
          supplier_id: string
          name: string
          email: string
          phone: string
          vehicle_number: string
          user_id: string
          password: string
          status: 'active' | 'inactive'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          supplier_id: string
          name: string
          email: string
          phone: string
          vehicle_number: string
          user_id: string
          password: string
          status?: 'active' | 'inactive'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          supplier_id?: string
          name?: string
          email?: string
          phone?: string
          vehicle_number?: string
          user_id?: string
          password?: string
          status?: 'active' | 'inactive'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          supplier_id: string
          name: string
          email: string
          phone: string
          address: string
          daily_quantity: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          supplier_id: string
          name: string
          email: string
          phone: string
          address: string
          daily_quantity: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          supplier_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          daily_quantity?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      customer_assignments: {
        Row: {
          id: string
          delivery_partner_id: string
          customer_id: string
          assigned_at: string | null
        }
        Insert: {
          id?: string
          delivery_partner_id: string
          customer_id: string
          assigned_at?: string | null
        }
        Update: {
          id?: string
          delivery_partner_id?: string
          customer_id?: string
          assigned_at?: string | null
        }
      }
      daily_allocations: {
        Row: {
          id: string
          supplier_id: string
          delivery_partner_id: string
          allocation_date: string
          allocated_quantity: number
          remaining_quantity: number
          status: 'allocated' | 'in_progress' | 'completed'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          supplier_id: string
          delivery_partner_id: string
          allocation_date: string
          allocated_quantity: number
          remaining_quantity: number
          status?: 'allocated' | 'in_progress' | 'completed'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          supplier_id?: string
          delivery_partner_id?: string
          allocation_date?: string
          allocated_quantity?: number
          remaining_quantity?: number
          status?: 'allocated' | 'in_progress' | 'completed'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      deliveries: {
        Row: {
          id: string
          supplier_id: string
          delivery_partner_id: string
          customer_id: string
          quantity: number
          delivery_date: string
          scheduled_time: string | null
          completed_time: string | null
          status: 'pending' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          supplier_id: string
          delivery_partner_id: string
          customer_id: string
          quantity: number
          delivery_date: string
          scheduled_time?: string | null
          completed_time?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          supplier_id?: string
          delivery_partner_id?: string
          customer_id?: string
          quantity?: number
          delivery_date?: string
          scheduled_time?: string | null
          completed_time?: string | null
          status?: 'pending' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}