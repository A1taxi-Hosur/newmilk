import { supabase } from './supabase';
import { hashPassword, verifyPassword, normalizePhone } from './auth';

export interface CustomerUser {
  id: string;
  phone: string;
  password: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface SupplierPricing {
  id: string;
  supplierId: string;
  pricePerLiter: number;
  effectiveFromDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyInvoice {
  id: string;
  customerId: string;
  supplierId: string;
  invoiceNumber: string;
  month: number;
  year: number;
  totalQuantity: number;
  totalAmount: number;
  pricePerLiter: number;
  deliveryCount: number;
  status: 'pending' | 'paid' | 'overdue';
  generatedAt: string;
  dueDate: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  deliveryId: string;
  deliveryDate: string;
  quantity: number;
  amount: number;
  notes?: string;
  createdAt: string;
}

const isSupabaseAvailable = () => {
  return supabase !== null;
};

export const addCustomerUser = async (data: { name: string; phone: string; password: string }): Promise<CustomerUser | null> => {
  try {
    const normalizedPhone = normalizePhone(data.phone);
    const hashedPassword = await hashPassword(data.password);

    const newCustomerUser: CustomerUser = {
      id: `cu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone: normalizedPhone,
      password: hashedPassword,
      name: data.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseAvailable()) {
      try {
        const { data: dbData, error } = await supabase!
          .from('customer_users')
          .insert([{
            phone: normalizedPhone,
            password: hashedPassword,
            name: data.name
          }])
          .select()
          .single();

        if (error) {
          console.warn('Database insert failed, using local storage:', error.message);
        } else {
          console.log('Successfully saved customer user to database:', dbData);
          newCustomerUser.id = dbData.id;
        }
      } catch (dbError) {
        console.warn('Database operation failed, continuing with local storage:', dbError);
      }
    }

    const existingUsers = JSON.parse(localStorage.getItem('customerUsers') || '[]');
    const updatedUsers = [newCustomerUser, ...existingUsers];
    localStorage.setItem('customerUsers', JSON.stringify(updatedUsers));

    console.log('Customer user added successfully:', newCustomerUser);
    return newCustomerUser;
  } catch (error: any) {
    console.error('Error adding customer user:', error);
    throw new Error(`Failed to create customer account: ${error.message}`);
  }
};

export const authenticateCustomer = async (phone: string, password: string): Promise<CustomerUser | null> => {
  try {
    const normalizedPhone = normalizePhone(phone);

    if (isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from('customer_users')
          .select('*')
          .eq('phone', normalizedPhone)
          .maybeSingle();

        if (error) {
          console.warn('Database query failed, checking local storage:', error.message);
        } else if (data) {
          const isValid = await verifyPassword(password, data.password);
          if (isValid) {
            const { error: updateError } = await supabase!
              .from('customer_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', data.id);

            if (updateError) {
              console.warn('Failed to update last login:', updateError);
            }

            return {
              id: data.id,
              phone: data.phone,
              password: data.password,
              name: data.name,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              lastLogin: data.last_login || undefined
            };
          }
          return null;
        }
      } catch (dbError) {
        console.warn('Database operation failed, checking local storage:', dbError);
      }
    }

    const existingUsers = JSON.parse(localStorage.getItem('customerUsers') || '[]');
    const customerUser = existingUsers.find((u: CustomerUser) => u.phone === normalizedPhone);

    if (customerUser) {
      const isValid = await verifyPassword(password, customerUser.password);
      if (isValid) {
        customerUser.lastLogin = new Date().toISOString();
        localStorage.setItem('customerUsers', JSON.stringify(existingUsers));
        return customerUser;
      }
    }

    return null;
  } catch (error: any) {
    console.error('Error authenticating customer:', error);
    return null;
  }
};

export const getSupplierPricing = async (supplierId: string): Promise<SupplierPricing | null> => {
  try {
    if (isSupabaseAvailable()) {
      const { data, error } = await supabase!
        .from('supplier_pricing')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          supplierId: data.supplier_id,
          pricePerLiter: parseFloat(data.price_per_liter),
          effectiveFromDate: data.effective_from_date,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    }

    const savedPricing = JSON.parse(localStorage.getItem('supplierPricing') || '[]');
    const pricing = savedPricing.find((p: SupplierPricing) => p.supplierId === supplierId && p.isActive);
    return pricing || null;
  } catch (error) {
    console.error('Error getting supplier pricing:', error);
    return null;
  }
};

export const updateSupplierPricing = async (supplierId: string, pricePerLiter: number): Promise<void> => {
  try {
    if (isSupabaseAvailable()) {
      await supabase!
        .from('supplier_pricing')
        .update({ is_active: false })
        .eq('supplier_id', supplierId)
        .eq('is_active', true);

      const { error } = await supabase!
        .from('supplier_pricing')
        .insert([{
          supplier_id: supplierId,
          price_per_liter: pricePerLiter,
          is_active: true,
          effective_from_date: new Date().toISOString().split('T')[0]
        }]);

      if (error) {
        console.warn('Database operation failed:', error);
      }
    }

    const savedPricing = JSON.parse(localStorage.getItem('supplierPricing') || '[]');
    savedPricing.forEach((p: SupplierPricing) => {
      if (p.supplierId === supplierId) {
        p.isActive = false;
      }
    });

    const newPricing: SupplierPricing = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      supplierId,
      pricePerLiter,
      effectiveFromDate: new Date().toISOString().split('T')[0],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savedPricing.push(newPricing);
    localStorage.setItem('supplierPricing', JSON.stringify(savedPricing));
  } catch (error) {
    console.error('Error updating supplier pricing:', error);
    throw error;
  }
};

export const getCustomerInvoices = async (phone: string): Promise<MonthlyInvoice[]> => {
  try {
    const normalizedPhone = normalizePhone(phone);

    if (isSupabaseAvailable()) {
      const { data, error } = await supabase!
        .from('monthly_invoices')
        .select(`
          *,
          customers!inner(phone)
        `)
        .eq('customers.phone', normalizedPhone)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (!error && data) {
        return data.map((invoice: any) => ({
          id: invoice.id,
          customerId: invoice.customer_id,
          supplierId: invoice.supplier_id,
          invoiceNumber: invoice.invoice_number,
          month: invoice.month,
          year: invoice.year,
          totalQuantity: parseFloat(invoice.total_quantity),
          totalAmount: parseFloat(invoice.total_amount),
          pricePerLiter: parseFloat(invoice.price_per_liter),
          deliveryCount: invoice.delivery_count,
          status: invoice.status,
          generatedAt: invoice.generated_at,
          dueDate: invoice.due_date,
          createdAt: invoice.created_at
        }));
      }
    }

    const savedInvoices = JSON.parse(localStorage.getItem('monthlyInvoices') || '[]');
    return savedInvoices;
  } catch (error) {
    console.error('Error getting customer invoices:', error);
    return [];
  }
};

export const getInvoiceLineItems = async (invoiceId: string): Promise<InvoiceLineItem[]> => {
  try {
    if (isSupabaseAvailable()) {
      const { data, error } = await supabase!
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('delivery_date', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id,
          invoiceId: item.invoice_id,
          deliveryId: item.delivery_id,
          deliveryDate: item.delivery_date,
          quantity: parseFloat(item.quantity),
          amount: parseFloat(item.amount),
          notes: item.notes,
          createdAt: item.created_at
        }));
      }
    }

    const savedLineItems = JSON.parse(localStorage.getItem('invoiceLineItems') || '[]');
    return savedLineItems.filter((item: InvoiceLineItem) => item.invoiceId === invoiceId);
  } catch (error) {
    console.error('Error getting invoice line items:', error);
    return [];
  }
};
