import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Please click "Connect to Supabase" in the top right to set up your database connection.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

// Test connection function
export const testConnection = async () => {
  if (!supabase) {
    return { connected: false, error: 'Supabase client not initialized' };
  }
  
  try {
    const { data, error } = await supabase.from('suppliers').select('count').limit(1);
    if (error) throw error;
    return { connected: true, error: null };
  } catch (error) {
    return { connected: false, error: (error as any).message };
  }
};

// Types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  license_number: string;
  total_capacity: number;
  status: 'pending' | 'approved' | 'rejected';
  registration_date: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPartner {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_number: string;
  user_id: string;
  password: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  daily_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerAssignment {
  id: string;
  delivery_partner_id: string;
  customer_id: string;
  assigned_at: string;
}

export interface DailyAllocation {
  id: string;
  supplier_id: string;
  delivery_partner_id: string;
  allocation_date: string;
  allocated_quantity: number;
  remaining_quantity: number;
  status: 'allocated' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  supplier_id: string;
  delivery_partner_id: string;
  customer_id: string;
  quantity: number;
  delivery_date: string;
  scheduled_time: string;
  completed_time?: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}