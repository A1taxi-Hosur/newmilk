import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type {
  Supplier as SupabaseSupplier,
  DeliveryPartner as SupabaseDeliveryPartner,
  Customer as SupabaseCustomer,
  DailyAllocation as SupabaseDailyAllocation,
  Delivery as SupabaseDelivery
} from '../lib/supabase';
import * as customerService from '../lib/customerService';
import type { CustomerUser, SupplierPricing, MonthlyInvoice, InvoiceLineItem } from '../lib/customerService';

export interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  supplierId: string;
  vehicleNumber: string;
  status: 'active' | 'inactive';
  password: string;
  assignedCustomers: string[];
  dailyAllocation: number;
  remainingQuantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  supplierId: string;
  dailyQuantity: number;
  status?: 'active' | 'paused';
  routeId?: string;
}

export interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  supplierId: string;
  userId: string;
  password: string;
  status: 'active' | 'inactive';
  routeId?: string;
}

export interface Route {
  id: string;
  name: string;
  description: string;
  supplierId: string;
  deliveryPartnerId?: string;
  createdAt: string;
}

export interface PickupLog {
  id: string;
  farmerId: string;
  supplierId: string;
  deliveryPartnerId?: string;
  quantity: number;
  qualityGrade: 'A' | 'B' | 'C';
  fatContent: number;
  pricePerLiter: number;
  totalAmount: number;
  date: string;
  pickupTime: string;
  status: 'pending' | 'completed';
  notes?: string;
  createdAt: string;
}
export interface Delivery {
  id: string;
  customerId: string;
  deliveryPartnerId: string;
  supplierId: string;
  quantity: number;
  suggestedQuantity: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  scheduledTime: string;
  completedTime?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  address: string;
  licenseNumber: string;
  totalCapacity: number;
  status: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
}

export interface DailyAllocation {
  id: string;
  supplierId: string;
  deliveryPartnerId: string;
  date: string;
  allocatedQuantity: number;
  remainingQuantity: number;
  status: 'allocated' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  unit: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  supplier_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  delivery_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface SupplierUpdate {
  id: string;
  supplier_id: string;
  title: string;
  content: string;
  type: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface DataContextType {
  suppliers: Supplier[];
  deliveryPartners: DeliveryPartner[];
  customers: Customer[];
  farmers: Farmer[];
  routes: Route[];
  pickupLogs: PickupLog[];
  deliveries: Delivery[];
  dailyAllocations: DailyAllocation[];
  products: Product[];
  orders: Order[];
  orderItems: OrderItem[];
  supplierUpdates: SupplierUpdate[];
  loading: boolean;
  error: string | null;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  addDeliveryPartner: (partner: Omit<DeliveryPartner, 'id' | 'assignedCustomers' | 'dailyAllocation' | 'remainingQuantity'>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => Promise<void>;
  addRoute: (route: Omit<Route, 'id'>) => Promise<void>;
  addPickupLog: (pickup: Omit<PickupLog, 'id'>) => Promise<void>;
  addDelivery: (delivery: Omit<Delivery, 'id'>) => Promise<void>;
  addDailyAllocation: (allocation: Omit<DailyAllocation, 'id'>) => Promise<void>;
  assignCustomersToPartner: (partnerId: string, customerIds: string[]) => Promise<void>;
  assignRouteToPartner: (routeId: string, partnerId: string) => Promise<void>;
  updateDeliveryStatus: (deliveryId: string, status: 'pending' | 'completed' | 'cancelled', notes?: string, quantity?: number) => Promise<void>;
  updateDeliveryQuantity: (deliveryId: string, quantity: number) => Promise<void>;
  updateCustomerStatus: (customerId: string, status: 'active' | 'paused') => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  updateDeliveryPartnerStatus: (partnerId: string, status: 'active' | 'paused') => Promise<void>;
  deleteDeliveryPartner: (partnerId: string) => Promise<void>;
  logPickup: (farmerId: string, deliveryPartnerId: string, routeId: string, quantity: number, notes?: string) => Promise<void>;
  getDailyAllocation: (partnerId: string, date: string) => DailyAllocation | undefined;
  getPartnerRoute: (partnerId: string) => Route | undefined;
  getRouteCustomers: (routeId: string) => Customer[];
  getRouteFarmers: (routeId: string) => Farmer[];
  updateRemainingQuantity: (partnerId: string, date: string, deliveredQuantity: number) => Promise<void>;
  updateSupplierStatus: (supplierId: string, status: 'approved' | 'rejected') => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  getPendingSuppliers: () => Supplier[];
  refreshData: () => Promise<void>;
  addCustomerUser: (data: { name: string; phone: string; password: string }) => Promise<CustomerUser | null>;
  authenticateCustomer: (phone: string, password: string) => Promise<CustomerUser | null>;
  getSupplierPricing: (supplierId: string) => Promise<SupplierPricing | null>;
  updateSupplierPricing: (supplierId: string, pricePerLiter: number) => Promise<void>;
  getCustomerInvoices: (phone: string) => Promise<MonthlyInvoice[]>;
  getInvoiceLineItems: (invoiceId: string) => Promise<InvoiceLineItem[]>;
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProduct: (productId: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  addSupplierUpdate: (update: Omit<SupplierUpdate, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSupplierUpdate: (updateId: string, update: Partial<Omit<SupplierUpdate, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteSupplierUpdate: (updateId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  suppliers: [],
  deliveryPartners: [],
  customers: [],
  farmers: [],
  routes: [],
  pickupLogs: [],
  deliveries: [],
  dailyAllocations: [],
  products: [],
  orders: [],
  orderItems: [],
  supplierUpdates: [],
  loading: false,
  error: null,
  addSupplier: async () => {},
  addDeliveryPartner: async () => {},
  addCustomer: async () => {},
  addFarmer: async () => {},
  addRoute: async () => {},
  addPickupLog: async () => {},
  addDelivery: async () => {},
  addDailyAllocation: async () => {},
  assignCustomersToPartner: async () => {},
  assignRouteToPartner: async () => {},
  updateDeliveryStatus: async () => {},
  updateDeliveryQuantity: async () => {},
  updateCustomerStatus: async () => {},
  deleteCustomer: async () => {},
  updateDeliveryPartnerStatus: async () => {},
  deleteDeliveryPartner: async () => {},
  logPickup: async () => {},
  getDailyAllocation: () => undefined,
  getPartnerRoute: () => undefined,
  getRouteCustomers: () => [],
  getRouteFarmers: () => [],
  updateRemainingQuantity: async () => {},
  updateSupplierStatus: async () => {},
  deleteSupplier: async () => {},
  getPendingSuppliers: () => [],
  refreshData: async () => {},
  addCustomerUser: async () => null,
  authenticateCustomer: async () => null,
  getSupplierPricing: async () => null,
  updateSupplierPricing: async () => {},
  getCustomerInvoices: async () => [],
  getInvoiceLineItems: async () => [],
  addProduct: async () => {},
  updateProduct: async () => {},
  deleteProduct: async () => {},
  addOrder: async () => {},
  updateOrderStatus: async () => {},
  addSupplierUpdate: async () => {},
  updateSupplierUpdate: async () => {},
  deleteSupplierUpdate: async () => {}
});

export const useData = () => useContext(DataContext);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pickupLogs, setPickupLogs] = useState<PickupLog[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [dailyAllocations, setDailyAllocations] = useState<DailyAllocation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [supplierUpdates, setSupplierUpdates] = useState<SupplierUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add state for customer assignments
  const [customerAssignments, setCustomerAssignments] = useState<{[partnerId: string]: string[]}>({});

  // Convert Supabase data to local format
  const convertSupplier = (supplier: SupabaseSupplier): Supplier => ({
    id: supplier.id,
    name: supplier.name,
    email: supplier.email,
    username: (supplier as any).username || supplier.email.split('@')[0],
    password: (supplier as any).password || '',
    phone: supplier.phone,
    address: supplier.address,
    licenseNumber: supplier.license_number,
    totalCapacity: supplier.total_capacity,
    status: supplier.status,
    registrationDate: supplier.registration_date || supplier.created_at
  });

  const convertDeliveryPartner = (partner: SupabaseDeliveryPartner): DeliveryPartner => ({
    id: partner.id,
    name: partner.name,
    email: partner.email,
    phone: partner.phone,
    supplierId: partner.supplier_id,
    vehicleNumber: partner.vehicle_number,
    status: partner.status,
    password: partner.password,
    assignedCustomers: customerAssignments[partner.id] || [],
    dailyAllocation: 0, // This will be updated when allocations are loaded
    remainingQuantity: 0 // This will be updated when allocations are loaded
  });

  const convertCustomer = (customer: SupabaseCustomer): Customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    supplierId: customer.supplier_id,
    dailyQuantity: customer.daily_quantity
  });

  const convertDelivery = (delivery: SupabaseDelivery): Delivery => ({
    id: delivery.id,
    customerId: delivery.customer_id,
    deliveryPartnerId: delivery.delivery_partner_id,
    supplierId: delivery.supplier_id,
    quantity: delivery.quantity,
    suggestedQuantity: delivery.quantity,
    date: delivery.delivery_date,
    status: delivery.status,
    scheduledTime: delivery.scheduled_time || '08:00 AM',
    completedTime: delivery.completed_time || undefined,
    notes: delivery.notes || undefined
  });

  const convertDailyAllocation = (allocation: SupabaseDailyAllocation): DailyAllocation => ({
    id: allocation.id,
    supplierId: allocation.supplier_id,
    deliveryPartnerId: allocation.delivery_partner_id,
    date: allocation.allocation_date,
    allocatedQuantity: allocation.allocated_quantity,
    remainingQuantity: allocation.remaining_quantity,
    status: allocation.status,
    createdAt: allocation.created_at
  });

  const convertFarmer = (farmer: any): Farmer => ({
    id: farmer.id,
    name: farmer.name,
    email: farmer.email || '',
    phone: farmer.phone,
    address: farmer.address || '',
    supplierId: farmer.supplier_id,
    userId: farmer.user_id,
    password: farmer.password,
    status: farmer.status
  });

  const convertPickupLog = (log: any): PickupLog => ({
    id: log.id,
    farmerId: log.farmer_id,
    supplierId: log.supplier_id,
    deliveryPartnerId: log.delivery_partner_id,
    quantity: log.quantity,
    qualityGrade: log.quality_grade,
    fatContent: log.fat_content,
    pricePerLiter: log.price_per_liter,
    totalAmount: log.total_amount,
    date: log.pickup_date,
    pickupTime: log.pickup_time,
    status: log.status,
    notes: log.notes,
    createdAt: log.created_at
  });

  // Check if Supabase is available
  const isSupabaseAvailable = () => {
    return supabase !== null;
  };

  // Load all data from Supabase
  const refreshData = async () => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase connection not available, using local storage');

      // Load from localStorage
      try {
        const savedSuppliers = localStorage.getItem('suppliers');
        if (savedSuppliers) {
          setSuppliers(JSON.parse(savedSuppliers));
        }

        const savedPartners = localStorage.getItem('deliveryPartners');
        if (savedPartners) {
          setDeliveryPartners(JSON.parse(savedPartners));
        }

        const savedCustomers = localStorage.getItem('customers');
        if (savedCustomers) {
          setCustomers(JSON.parse(savedCustomers));
        }

        const savedFarmers = localStorage.getItem('farmers');
        if (savedFarmers) {
          setFarmers(JSON.parse(savedFarmers));
        }

        const savedPickupLogs = localStorage.getItem('pickupLogs');
        if (savedPickupLogs) {
          setPickupLogs(JSON.parse(savedPickupLogs));
        }

        const savedAssignments = localStorage.getItem('customerAssignments');
        if (savedAssignments) {
          const assignments = JSON.parse(savedAssignments);
          setCustomerAssignments(assignments);

          // Update delivery partners with their assigned customers
          const savedPartners = localStorage.getItem('deliveryPartners');
          if (savedPartners) {
            const partners = JSON.parse(savedPartners);
            const updatedPartners = partners.map((partner: DeliveryPartner) => ({
              ...partner,
              assignedCustomers: assignments[partner.id] || partner.assignedCustomers || []
            }));
            setDeliveryPartners(updatedPartners);
          }
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase!
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (suppliersError) throw suppliersError;
      setSuppliers((suppliersData || []).map(convertSupplier));

      // Load delivery partners
      const { data: partnersData, error: partnersError } = await supabase!
        .from('delivery_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;
      setDeliveryPartners((partnersData || []).map(convertDeliveryPartner));

      // Load customers
      const { data: customersData, error: customersError } = await supabase!
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;
      setCustomers((customersData || []).map(convertCustomer));

      // Load deliveries
      const { data: deliveriesData, error: deliveriesError } = await supabase!
        .from('deliveries')
        .select('*')
        .order('delivery_date', { ascending: false });

      if (deliveriesError) throw deliveriesError;
      setDeliveries((deliveriesData || []).map(convertDelivery));

      // Load daily allocations
      const { data: allocationsData, error: allocationsError } = await supabase!
        .from('daily_allocations')
        .select('*')
        .order('allocation_date', { ascending: false });

      if (allocationsError) throw allocationsError;
      setDailyAllocations((allocationsData || []).map(convertDailyAllocation));

      // Load farmers
      const { data: farmersData, error: farmersError } = await supabase!
        .from('farmers')
        .select('*')
        .order('created_at', { ascending: false });

      if (farmersError) {
        console.warn('Error loading farmers:', farmersError);
      } else {
        setFarmers((farmersData || []).map(convertFarmer));
      }

      // Load pickup logs
      const { data: pickupLogsData, error: pickupLogsError } = await supabase!
        .from('pickup_logs')
        .select('*')
        .order('pickup_time', { ascending: false });

      if (pickupLogsError) {
        console.warn('Error loading pickup logs:', pickupLogsError);
      } else {
        setPickupLogs((pickupLogsData || []).map(convertPickupLog));
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase!
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.warn('Error loading products:', productsError);
      } else {
        setProducts(productsData || []);
      }

      // Load orders
      const { data: ordersData, error: ordersError } = await supabase!
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.warn('Error loading orders:', ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Load order items
      const { data: orderItemsData, error: orderItemsError } = await supabase!
        .from('order_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderItemsError) {
        console.warn('Error loading order items:', orderItemsError);
      } else {
        setOrderItems(orderItemsData || []);
      }

      // Load supplier updates
      const { data: updatesData, error: updatesError } = await supabase!
        .from('supplier_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatesError) {
        console.warn('Error loading supplier updates:', updatesError);
      } else {
        setSupplierUpdates(updatesData || []);
      }

    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Load customer assignments from database or initialize with demo data
  const loadCustomerAssignments = async () => {
    console.log('Loading customer assignments...');
    
    if (isSupabaseAvailable()) {
      try {
        const { data: assignments, error } = await supabase!
          .from('customer_assignments')
          .select('*');

        if (!error && assignments && assignments.length > 0) {
          // Build assignments object
          const assignmentsMap: {[partnerId: string]: string[]} = {};
          assignments.forEach(assignment => {
            if (!assignmentsMap[assignment.delivery_partner_id]) {
              assignmentsMap[assignment.delivery_partner_id] = [];
            }
            assignmentsMap[assignment.delivery_partner_id].push(assignment.customer_id);
          });
          
          console.log('Loaded assignments from database:', assignmentsMap);
          setCustomerAssignments(assignmentsMap);
        } else {
          console.log('No customer assignments found in database, checking localStorage...');
          // Try to load from localStorage
          const savedAssignments = localStorage.getItem('customerAssignments');
          if (savedAssignments) {
            const parsedAssignments = JSON.parse(savedAssignments);
            console.log('Loaded assignments from localStorage:', parsedAssignments);
            setCustomerAssignments(parsedAssignments);
          }
        }
      } catch (error) {
        console.warn('Failed to load customer assignments from database:', error);
        // Fallback to localStorage
        const savedAssignments = localStorage.getItem('customerAssignments');
        if (savedAssignments) {
          const parsedAssignments = JSON.parse(savedAssignments);
          console.log('Loaded assignments from localStorage (fallback):', parsedAssignments);
          setCustomerAssignments(parsedAssignments);
        }
      }
    } else {
      console.log('Supabase not available, loading from localStorage...');
      const savedAssignments = localStorage.getItem('customerAssignments');
      if (savedAssignments) {
        const parsedAssignments = JSON.parse(savedAssignments);
        console.log('Loaded assignments from localStorage:', parsedAssignments);
        setCustomerAssignments(parsedAssignments);
      }
    }
  };

  // Load customer assignments after data is loaded
  useEffect(() => {
    if (!loading) {
      loadCustomerAssignments();
    }
  }, [loading]);

  // Update delivery partners when assignments change
  useEffect(() => {
    if (Object.keys(customerAssignments).length > 0) {
      console.log('Updating delivery partners with assignments:', customerAssignments);
      setDeliveryPartners(prev => 
        prev.map(partner => ({
          ...partner,
          assignedCustomers: customerAssignments[partner.id] || []
        }))
      );
    }
  }, [customerAssignments]);

  // Update delivery partners with daily allocations - Enhanced for cross-login sharing
  useEffect(() => {
    if (dailyAllocations.length > 0 && deliveryPartners.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      console.log('Updating delivery partners with daily allocations for:', today);
      console.log('Available daily allocations:', dailyAllocations);
      console.log('Current delivery partners:', deliveryPartners);
      
      setDeliveryPartners(prev => 
        prev.map(partner => {
          const todayAllocation = dailyAllocations.find(allocation => 
            allocation.deliveryPartnerId === partner.id && allocation.date === today
          );
          
          console.log(`Partner ${partner.name} (${partner.id}) allocation:`, todayAllocation);
          
          const updatedPartner = {
            ...partner,
            dailyAllocation: todayAllocation?.allocatedQuantity || partner.dailyAllocation || 0,
            remainingQuantity: todayAllocation?.remainingQuantity || partner.remainingQuantity || 0
          };
          
          console.log(`Updated partner ${partner.name}:`, updatedPartner);
          return updatedPartner;
        })
      );
    }
  }, [dailyAllocations, deliveryPartners.length]);

  // Enhanced data synchronization
  useEffect(() => {
    // Force update delivery partners when data changes
    const updateDeliveryPartnersWithAllocations = () => {
      if (deliveryPartners.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        console.log('Force updating delivery partners with allocations');
        
        setDeliveryPartners(prev => 
          prev.map(partner => {
            const todayAllocation = dailyAllocations.find(allocation => 
              allocation.deliveryPartnerId === partner.id && allocation.date === today
            );
            
            if (todayAllocation) {
              console.log(`Found allocation for ${partner.name}:`, todayAllocation);
              return {
                ...partner,
                dailyAllocation: todayAllocation.allocatedQuantity,
                remainingQuantity: todayAllocation.remainingQuantity
              };
            }
            
            return partner;
          })
        );
      }
    };
    
    // Update when allocations change
    if (dailyAllocations.length > 0) {
      updateDeliveryPartnersWithAllocations();
    }
  }, [dailyAllocations]);

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const supplierId = `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create local supplier object first
      const newSupplier: Supplier = {
        id: supplierId,
        name: supplier.name,
        email: supplier.email,
        username: supplier.username,
        password: supplier.password,
        phone: supplier.phone,
        address: supplier.address,
        licenseNumber: supplier.licenseNumber,
        totalCapacity: supplier.totalCapacity,
        status: supplier.status,
        registrationDate: supplier.registrationDate
      };

      // Try to save to database if available
      if (isSupabaseAvailable()) {
        try {
          const { data, error } = await supabase!
            .from('suppliers')
            .insert([{
              name: supplier.name,
              email: supplier.email,
              username: supplier.username,
              password: supplier.password,
              phone: supplier.phone,
              address: supplier.address,
              license_number: supplier.licenseNumber,
              total_capacity: supplier.totalCapacity,
              status: supplier.status
            } as any])
            .select()
            .single();

          if (error) {
            console.warn('Database insert failed, using local storage:', error.message);
          } else {
            console.log('Successfully saved supplier to database:', data);
            // Update with database ID if successful
            newSupplier.id = data.id;
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      // Always update local state
      setSuppliers(prev => {
        const updated = [newSupplier, ...prev];
        // Save to localStorage
        localStorage.setItem('suppliers', JSON.stringify(updated));
        return updated;
      });

      console.log('Supplier added successfully:', newSupplier);
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      // Don't throw error, just log it for demo purposes
      console.warn('Continuing with local storage due to error:', error.message);
    }
  };

  const addDeliveryPartner = async (partner: Omit<DeliveryPartner, 'id' | 'assignedCustomers' | 'dailyAllocation' | 'remainingQuantity'>) => {
    try {
      const userId = `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create local partner object first
      const newPartner: DeliveryPartner = {
        id: userId,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        supplierId: partner.supplierId,
        vehicleNumber: partner.vehicleNumber,
        status: partner.status,
        password: partner.password,
        assignedCustomers: [],
        dailyAllocation: 0,
        remainingQuantity: 0
      };

      // Try to save to database if available
      if (isSupabaseAvailable()) {
        try {
          const { data, error } = await supabase!
            .from('delivery_partners')
            .insert([{
              supplier_id: partner.supplierId,
              name: partner.name,
              email: partner.email,
              phone: partner.phone,
              vehicle_number: partner.vehicleNumber,
              user_id: userId,
              password: partner.password,
              status: partner.status
            }])
            .select()
            .single();

          if (error) {
            console.warn('Database insert failed, using local storage:', error.message);
          } else {
            console.log('Successfully saved to database:', data);
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }
      
      // Always update local state and persist to localStorage
      setDeliveryPartners(prev => {
        const updated = [newPartner, ...prev];
        localStorage.setItem('deliveryPartners', JSON.stringify(updated));
        return updated;
      });

      console.log('Delivery partner added successfully:', newPartner);

    } catch (error: any) {
      console.error('Error adding delivery partner:', error);
      // Don't throw error, just log it for demo purposes
      console.warn('Continuing with local storage due to error:', error.message);
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      // Generate unique customer ID
      const customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create local customer object first
      const newCustomer: Customer = {
        id: customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        supplierId: customer.supplierId,
        dailyQuantity: customer.dailyQuantity
      };

      // Try to save to database if available
      if (isSupabaseAvailable()) {
        try {
          const { data, error } = await supabase!
            .from('customers')
            .insert([{
              supplier_id: customer.supplierId,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              daily_quantity: customer.dailyQuantity
            }])
            .select()
            .single();

          if (error) {
            console.warn('Database insert failed, using local storage:', error.message);
          } else {
            console.log('Successfully saved customer to database:', data);
            // Update with database ID if successful
            newCustomer.id = data.id;
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }
      
      // Always update local state and persist to localStorage
      setCustomers(prev => {
        const updated = [newCustomer, ...prev];
        localStorage.setItem('customers', JSON.stringify(updated));
        return updated;
      });

      console.log('Customer added successfully:', newCustomer);
      return newCustomer;
    } catch (error: any) {
      console.error('Error adding customer:', error);
      // Don't throw error, just log it for demo purposes
      console.warn('Continuing with local storage due to error:', error.message);
      return null;
    }
  };

  const addDelivery = async (delivery: Omit<Delivery, 'id'>) => {
    try {
      const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newDelivery: Delivery = {
        id: deliveryId,
        customerId: delivery.customerId,
        deliveryPartnerId: delivery.deliveryPartnerId,
        supplierId: delivery.supplierId,
        quantity: delivery.quantity,
        suggestedQuantity: delivery.suggestedQuantity,
        date: delivery.date,
        status: delivery.status,
        scheduledTime: delivery.scheduledTime,
        completedTime: delivery.completedTime,
        notes: delivery.notes
      };

      if (isSupabaseAvailable()) {
        try {
          const { data, error } = await supabase!
            .from('deliveries')
            .insert([{
              supplier_id: delivery.supplierId,
              delivery_partner_id: delivery.deliveryPartnerId,
              customer_id: delivery.customerId,
              quantity: delivery.quantity,
              delivery_date: delivery.date,
              scheduled_time: delivery.scheduledTime,
              completed_time: delivery.completedTime,
              status: delivery.status,
              notes: delivery.notes
            }])
            .select()
            .single();

          if (error) {
            console.warn('Database insert failed, using local storage:', error.message);
          } else {
            console.log('Successfully saved delivery to database:', data);
            newDelivery.id = data.id;
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      setDeliveries(prev => {
        const updated = [newDelivery, ...prev];
        localStorage.setItem('deliveries', JSON.stringify(updated));
        return updated;
      });

      console.log('Delivery added successfully:', newDelivery);
      return newDelivery;
    } catch (error: any) {
      console.error('Error adding delivery:', error);
      throw new Error(`Failed to add delivery: ${error.message}`);
    }
  };
  // Load allocations from localStorage on mount
  useEffect(() => {
    const loadLocalAllocations = () => {
      try {
        const savedAllocations = localStorage.getItem('dailyAllocations');
        if (savedAllocations) {
          const allocations = JSON.parse(savedAllocations);
          console.log('Loading allocations from localStorage:', allocations);
          setDailyAllocations(allocations);
        }
      } catch (error) {
        console.error('Error loading allocations from localStorage:', error);
      }
    };

    loadLocalAllocations();
  }, []);

  // Generate deliveries when allocations are created
  const generateDeliveriesFromAllocation = async (allocation: DailyAllocation) => {
    console.log('Generating deliveries for allocation:', allocation);
    
    // Get assigned customers for this delivery partner
    const partner = deliveryPartners.find(dp => dp.id === allocation.deliveryPartnerId);
    const assignedCustomerIds = partner?.assignedCustomers || [];
    const assignedCustomers = customers.filter(c => assignedCustomerIds.includes(c.id));
    
    console.log('Found assigned customers:', assignedCustomers);
    
    // Create delivery for each assigned customer
    for (const customer of assignedCustomers) {
      const newDelivery: Delivery = {
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: customer.id,
        deliveryPartnerId: allocation.deliveryPartnerId,
        supplierId: allocation.supplierId,
        quantity: customer.dailyQuantity,
        suggestedQuantity: customer.dailyQuantity,
        date: allocation.date,
        status: 'pending',
        scheduledTime: '08:00 AM'
      };
      
      setDeliveries(prev => [newDelivery, ...prev]);
      
      // Save to localStorage
      const existingDeliveries = JSON.parse(localStorage.getItem('deliveries') || '[]');
      const updatedDeliveries = [newDelivery, ...existingDeliveries];
      localStorage.setItem('deliveries', JSON.stringify(updatedDeliveries));
    }
  };

  const addDailyAllocation = async (allocation: Omit<DailyAllocation, 'id'>) => {
    try {
      console.log('Adding daily allocation:', allocation);
      
      // Create allocation object
      const newAllocation: DailyAllocation = {
        id: `allocation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        supplierId: allocation.supplierId,
        deliveryPartnerId: allocation.deliveryPartnerId,
        date: allocation.date,
        allocatedQuantity: allocation.allocatedQuantity,
        remainingQuantity: allocation.remainingQuantity,
        status: allocation.status,
        createdAt: new Date().toISOString()
      };

      // Try to save to database if available
      if (isSupabaseAvailable()) {
        try {
          const { data, error } = await supabase!
            .from('daily_allocations')
            .insert([{
              supplier_id: allocation.supplierId,
              delivery_partner_id: allocation.deliveryPartnerId,
              allocation_date: allocation.date,
              allocated_quantity: allocation.allocatedQuantity,
              remaining_quantity: allocation.remainingQuantity,
              status: allocation.status
            }])
            .select()
            .single();

          if (error) {
            console.warn('Database insert failed, using local storage:', error.message);
          } else {
            console.log('Successfully saved allocation to database:', data);
            newAllocation.id = data.id;
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }
      
      // Always update local state
      setDailyAllocations(prev => [newAllocation, ...prev]);
      
      console.log('Added daily allocation and updated delivery partner:', newAllocation);
      
      // Save to localStorage for cross-login sharing
      const existingAllocations = JSON.parse(localStorage.getItem('dailyAllocations') || '[]');
      const updatedAllocations = [newAllocation, ...existingAllocations];
      localStorage.setItem('dailyAllocations', JSON.stringify(updatedAllocations));
      
      // Generate deliveries for assigned customers
      await generateDeliveriesFromAllocation(newAllocation);
      
    } catch (error: any) {
      console.error('Error adding daily allocation:', error);
      // Don't throw error for demo purposes
      console.warn('Continuing with local storage due to error:', error.message);
    }
  };

  const assignCustomersToPartner = async (partnerId: string, customerIds: string[]) => {
    try {
      console.log('assignCustomersToPartner called:', { partnerId, customerIds });
      
      // Try database operations if available
      if (isSupabaseAvailable()) {
        try {
          // First, remove existing assignments for this partner
          console.log('Removing existing assignments for partner:', partnerId);
          await supabase!
            .from('customer_assignments')
            .delete()
            .eq('delivery_partner_id', partnerId);

          // Then add new assignments
          if (customerIds.length > 0) {
            const assignments = customerIds.map(customerId => ({
              delivery_partner_id: partnerId,
              customer_id: customerId
            }));

            console.log('Inserting new assignments:', assignments);
            const { error } = await supabase!
              .from('customer_assignments')
              .insert(assignments);

            if (error) {
              console.warn('Database assignment failed, using local storage:', error.message);
            } else {
              console.log('Successfully saved assignments to database');
            }
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      // Update customer assignments state
      const newAssignments = {
        ...customerAssignments,
        [partnerId]: customerIds
      };

      console.log('Updating customer assignments:', newAssignments);
      setCustomerAssignments(newAssignments);

      // Update the delivery partner's assignedCustomers array directly
      setDeliveryPartners(prev => {
        const updated = prev.map(partner =>
          partner.id === partnerId
            ? { ...partner, assignedCustomers: customerIds }
            : partner
        );
        localStorage.setItem('deliveryPartners', JSON.stringify(updated));
        return updated;
      });

      // Save to localStorage as backup
      localStorage.setItem('customerAssignments', JSON.stringify(newAssignments));
      console.log('Saved assignments to localStorage and updated delivery partners');

    } catch (error: any) {
      console.error('Error assigning customers to partner:', error);
      // Still update local state even if database fails
      const newAssignments = {
        ...customerAssignments,
        [partnerId]: customerIds
      };
      setCustomerAssignments(newAssignments);

      // Update delivery partners
      setDeliveryPartners(prev => {
        const updated = prev.map(partner =>
          partner.id === partnerId
            ? { ...partner, assignedCustomers: customerIds }
            : partner
        );
        localStorage.setItem('deliveryPartners', JSON.stringify(updated));
        return updated;
      });

      localStorage.setItem('customerAssignments', JSON.stringify(newAssignments));
    }
  };

  // Load deliveries from localStorage
  useEffect(() => {
    const loadLocalDeliveries = () => {
      try {
        const savedDeliveries = localStorage.getItem('deliveries');
        if (savedDeliveries) {
          const deliveries = JSON.parse(savedDeliveries);
          console.log('Loading deliveries from localStorage:', deliveries);
          setDeliveries(deliveries);
        }
      } catch (error) {
        console.error('Error loading deliveries from localStorage:', error);
      }
    };

    loadLocalDeliveries();
  }, []);

  const updateDeliveryStatus = async (deliveryId: string, status: 'pending' | 'completed' | 'cancelled', notes?: string, quantity?: number) => {
    try {
      console.log('Updating delivery status:', { deliveryId, status, notes, quantity });

      // Check if delivery exists
      let existingDelivery = deliveries.find(d => d.id === deliveryId);

      // If delivery doesn't exist, create it from the deliveryId pattern
      if (!existingDelivery) {
        const parts = deliveryId.split('_');
        if (parts.length >= 3) {
          const customerId = parts[0];
          const partnerId = parts[1];
          const date = parts[2];

          const customer = customers.find(c => c.id === customerId);
          const partner = deliveryPartners.find(p => p.id === partnerId);

          if (customer && partner) {
            const newDelivery: Delivery = {
              id: deliveryId,
              customerId: customerId,
              customerName: customer.name,
              deliveryPartnerId: partnerId,
              supplierId: partner.supplierId,
              quantity: quantity || customer.dailyQuantity,
              date: date,
              status: status,
              notes: notes || '',
              completedTime: status === 'completed' ? new Date().toISOString() : undefined
            };

            setDeliveries(prev => [...prev, newDelivery]);
            const currentDeliveries = JSON.parse(localStorage.getItem('deliveries') || '[]');
            currentDeliveries.push(newDelivery);
            localStorage.setItem('deliveries', JSON.stringify(currentDeliveries));

            existingDelivery = newDelivery;
            console.log('Created new delivery:', newDelivery);
          }
        }
      } else {
        // Update existing delivery
        setDeliveries(prev =>
          prev.map(delivery =>
            delivery.id === deliveryId ? {
              ...delivery,
              status,
              notes,
              quantity: quantity !== undefined ? quantity : delivery.quantity,
              completedTime: status === 'completed' ? new Date().toISOString() : delivery.completedTime
            } : delivery
          )
        );

        // Update localStorage
        const currentDeliveries = JSON.parse(localStorage.getItem('deliveries') || '[]');
        const updatedDeliveries = currentDeliveries.map((delivery: any) =>
          delivery.id === deliveryId ? {
            ...delivery,
            status,
            notes,
            quantity: quantity !== undefined ? quantity : delivery.quantity,
            completedTime: status === 'completed' ? new Date().toISOString() : delivery.completedTime
          } : delivery
        );
        localStorage.setItem('deliveries', JSON.stringify(updatedDeliveries));
        console.log('localStorage updated');
      }

      // Update remaining quantity if completed
      if (status === 'completed' && existingDelivery) {
        const finalQuantity = quantity !== undefined ? quantity : existingDelivery.quantity;
        await updateRemainingQuantity(existingDelivery.deliveryPartnerId, existingDelivery.date, finalQuantity);
      }

    } catch (error: any) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  };

  const getDailyAllocation = (partnerId: string, date: string): DailyAllocation | undefined => {
    return dailyAllocations.find(allocation => 
      allocation.deliveryPartnerId === partnerId && allocation.date === date
    );
  };

  const updateRemainingQuantity = async (partnerId: string, date: string, deliveredQuantity: number) => {
    try {
      const allocation = getDailyAllocation(partnerId, date);
      if (!allocation) return;

      const newRemainingQuantity = Math.max(0, allocation.remainingQuantity - deliveredQuantity);
      const newStatus = newRemainingQuantity <= 0 ? 'completed' : 'in_progress';

      // Try to update database if available
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!
            .from('daily_allocations')
            .update({
              remaining_quantity: newRemainingQuantity,
              status: newStatus
            })
            .eq('id', allocation.id);

          if (error) {
            console.warn('Database update failed, updating local state only:', error.message);
          }
        } catch (dbError) {
          console.warn('Database operation failed, updating local state only:', dbError);
        }
      }

      // Update local state
      setDailyAllocations(prev => 
        prev.map(alloc => 
          alloc.id === allocation.id 
            ? { 
                ...alloc, 
                remainingQuantity: newRemainingQuantity,
                status: newStatus
              } 
            : alloc
        )
      );
      
      // Also update delivery partner's remaining quantity
      setDeliveryPartners(prev => 
        prev.map(partner => 
          partner.id === partnerId 
            ? { 
                ...partner, 
                remainingQuantity: newRemainingQuantity 
              } 
            : partner
        )
      );
      
      console.log(`Updated remaining quantity for partner ${partnerId}: ${newRemainingQuantity}L`);
    } catch (error: any) {
      console.error('Error updating remaining quantity:', error);
      // Don't throw error, just log it for demo purposes
      console.warn('Continuing with local state update due to error:', error.message);
    }
  };

  const updateSupplierStatus = async (supplierId: string, status: 'approved' | 'rejected') => {
    try {
      // Try to update database if available
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!
            .from('suppliers')
            .update({ status })
            .eq('id', supplierId);

          if (error) {
            console.warn('Database update failed, using local storage:', error.message);
          } else {
            console.log('Successfully updated supplier status in database');
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      // Always update local state
      setSuppliers(prev => {
        const updated = prev.map(supplier =>
          supplier.id === supplierId
            ? { ...supplier, status }
            : supplier
        );
        // Save to localStorage
        localStorage.setItem('suppliers', JSON.stringify(updated));
        return updated;
      });

      console.log(`Supplier ${supplierId} status updated to ${status}`);
    } catch (error: any) {
      console.error('Error updating supplier status:', error);
      // Don't throw error, just log it for demo purposes
      console.warn('Continuing with local storage due to error:', error.message);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!.from('suppliers').delete().eq('id', supplierId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  const getPendingSuppliers = (): Supplier[] => {
    return suppliers.filter(supplier => supplier.status === 'pending');
  };

  const updateCustomerStatus = async (customerId: string, status: 'active' | 'paused') => {
    try {
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!
            .from('customers')
            .update({ status })
            .eq('id', customerId);

          if (error) {
            console.warn('Database update failed, using local storage:', error.message);
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      setCustomers(prev => {
        const updated = prev.map(customer =>
          customer.id === customerId
            ? { ...customer, status }
            : customer
        );
        localStorage.setItem('customers', JSON.stringify(updated));
        return updated;
      });

      console.log(`Customer ${customerId} status updated to ${status}`);
    } catch (error: any) {
      console.error('Error updating customer status:', error);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!
            .from('customers')
            .delete()
            .eq('id', customerId);

          if (error) {
            console.warn('Database delete failed, using local storage:', error.message);
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      setCustomers(prev => {
        const updated = prev.filter(customer => customer.id !== customerId);
        localStorage.setItem('customers', JSON.stringify(updated));
        return updated;
      });

      console.log(`Customer ${customerId} deleted`);
    } catch (error: any) {
      console.error('Error deleting customer:', error);
    }
  };

  const updateDeliveryPartnerStatus = async (partnerId: string, status: 'active' | 'paused') => {
    try {
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!
            .from('delivery_partners')
            .update({ status: status === 'active' ? 'active' : 'inactive' })
            .eq('id', partnerId);

          if (error) {
            console.warn('Database update failed, using local storage:', error.message);
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      setDeliveryPartners(prev => {
        const updated = prev.map(partner =>
          partner.id === partnerId
            ? { ...partner, status: status === 'active' ? 'active' : 'inactive' }
            : partner
        );
        localStorage.setItem('deliveryPartners', JSON.stringify(updated));
        return updated;
      });

      console.log(`Delivery Partner ${partnerId} status updated to ${status}`);
    } catch (error: any) {
      console.error('Error updating delivery partner status:', error);
    }
  };

  const deleteDeliveryPartner = async (partnerId: string) => {
    try {
      if (isSupabaseAvailable()) {
        try {
          const { error } = await supabase!
            .from('delivery_partners')
            .delete()
            .eq('id', partnerId);

          if (error) {
            console.warn('Database delete failed, using local storage:', error.message);
          }
        } catch (dbError) {
          console.warn('Database operation failed, continuing with local storage:', dbError);
        }
      }

      setDeliveryPartners(prev => {
        const updated = prev.filter(partner => partner.id !== partnerId);
        localStorage.setItem('deliveryPartners', JSON.stringify(updated));
        return updated;
      });

      console.log(`Delivery Partner ${partnerId} deleted`);
    } catch (error: any) {
      console.error('Error deleting delivery partner:', error);
    }
  };

  const addFarmer = async (farmer: Omit<Farmer, 'id'>) => {
    try {
      const farmerId = `farmer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newFarmer: Farmer = {
        id: farmerId,
        name: farmer.name,
        email: farmer.email,
        phone: farmer.phone,
        address: farmer.address,
        supplierId: farmer.supplierId,
        userId: farmer.userId,
        password: farmer.password,
        status: farmer.status || 'active',
        routeId: farmer.routeId
      };

      if (isSupabaseAvailable()) {
        const { error } = await supabase!
          .from('farmers')
          .insert([{
            id: farmerId,
            supplier_id: farmer.supplierId,
            name: farmer.name,
            email: farmer.email,
            phone: farmer.phone,
            address: farmer.address,
            user_id: farmer.userId,
            password: farmer.password,
            status: farmer.status || 'active'
          }]);

        if (error) {
          console.warn('Database insert failed, continuing with local storage:', error);
        }
      }

      setFarmers(prev => {
        const updated = [newFarmer, ...prev];
        localStorage.setItem('farmers', JSON.stringify(updated));
        return updated;
      });
      console.log('Farmer added successfully:', newFarmer);
      return newFarmer;
    } catch (error: any) {
      console.error('Error adding farmer:', error);
      return null;
    }
  };

  const addRoute = async (route: Omit<Route, 'id'>) => {
    try {
      const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newRoute: Route = {
        id: routeId,
        name: route.name,
        description: route.description,
        supplierId: route.supplierId,
        deliveryPartnerId: route.deliveryPartnerId,
        createdAt: new Date().toISOString()
      };

      setRoutes(prev => [newRoute, ...prev]);
      console.log('Route added successfully:', newRoute);
      return newRoute;
    } catch (error: any) {
      console.error('Error adding route:', error);
      return null;
    }
  };

  const addPickupLog = async (pickup: Omit<PickupLog, 'id'>) => {
    try {
      const pickupId = `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalAmount = pickup.quantity * pickup.pricePerLiter;

      const newPickup: PickupLog = {
        id: pickupId,
        farmerId: pickup.farmerId,
        supplierId: pickup.supplierId,
        deliveryPartnerId: pickup.deliveryPartnerId,
        quantity: pickup.quantity,
        qualityGrade: pickup.qualityGrade || 'A',
        fatContent: pickup.fatContent || 0,
        pricePerLiter: pickup.pricePerLiter,
        totalAmount,
        date: pickup.date,
        pickupTime: pickup.pickupTime || new Date().toISOString(),
        status: pickup.status || 'completed',
        notes: pickup.notes,
        createdAt: new Date().toISOString()
      };

      if (isSupabaseAvailable()) {
        const { error } = await supabase!
          .from('pickup_logs')
          .insert([{
            id: pickupId,
            farmer_id: pickup.farmerId,
            supplier_id: pickup.supplierId,
            delivery_partner_id: pickup.deliveryPartnerId,
            quantity: pickup.quantity,
            quality_grade: pickup.qualityGrade || 'A',
            fat_content: pickup.fatContent || 0,
            price_per_liter: pickup.pricePerLiter,
            total_amount: totalAmount,
            pickup_date: pickup.date,
            pickup_time: pickup.pickupTime || new Date().toISOString(),
            status: pickup.status || 'completed',
            notes: pickup.notes
          }]);

        if (error) {
          console.warn('Database insert failed, continuing with local storage:', error);
        }
      }

      setPickupLogs(prev => {
        const updated = [newPickup, ...prev];
        localStorage.setItem('pickupLogs', JSON.stringify(updated));
        return updated;
      });
      console.log('Pickup log added successfully:', newPickup);
      return newPickup;
    } catch (error: any) {
      console.error('Error adding pickup log:', error);
      return null;
    }
  };

  const assignRouteToPartner = async (routeId: string, partnerId: string) => {
    try {
      setRoutes(prev => 
        prev.map(route => 
          route.id === routeId 
            ? { ...route, deliveryPartnerId: partnerId }
            : route
        )
      );
      console.log('Route assigned to partner successfully');
    } catch (error: any) {
      console.error('Error assigning route to partner:', error);
    }
  };

  const updateDeliveryQuantity = async (deliveryId: string, quantity: number) => {
    try {
      setDeliveries(prev => 
        prev.map(delivery => 
          delivery.id === deliveryId 
            ? { ...delivery, quantity }
            : delivery
        )
      );
      console.log('Delivery quantity updated successfully');
    } catch (error: any) {
      console.error('Error updating delivery quantity:', error);
    }
  };

  const logPickup = async (farmerId: string, deliveryPartnerId: string, routeId: string, quantity: number, notes?: string) => {
    try {
      await addPickupLog({
        farmerId,
        deliveryPartnerId,
        routeId,
        quantity,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        notes,
        createdAt: new Date().toISOString()
      });
      console.log('Pickup logged successfully');
    } catch (error: any) {
      console.error('Error logging pickup:', error);
    }
  };

  const getPartnerRoute = (partnerId: string): Route | undefined => {
    return routes.find(route => route.deliveryPartnerId === partnerId);
  };

  const getRouteCustomers = (routeId: string): Customer[] => {
    return customers.filter(customer => customer.routeId === routeId);
  };

  const getRouteFarmers = (routeId: string): Farmer[] => {
    return farmers.filter(farmer => farmer.routeId === routeId);
  };

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!.from('products').insert([product]);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (productId: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!
        .from('products')
        .update({ ...product, updated_at: new Date().toISOString() })
        .eq('id', productId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!.from('products').delete().eq('id', productId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const addOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>, items: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { data: orderData, error: orderError } = await supabase!
        .from('orders')
        .insert([order])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsWithOrderId = items.map(item => ({
        ...item,
        order_id: orderData.id
      }));

      const { error: itemsError } = await supabase!
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (itemsError) throw itemsError;

      await refreshData();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const addSupplierUpdate = async (update: Omit<SupplierUpdate, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!.from('supplier_updates').insert([update]);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error adding supplier update:', error);
      throw error;
    }
  };

  const updateSupplierUpdate = async (updateId: string, update: Partial<Omit<SupplierUpdate, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!
        .from('supplier_updates')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', updateId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error updating supplier update:', error);
      throw error;
    }
  };

  const deleteSupplierUpdate = async (updateId: string) => {
    if (!isSupabaseAvailable()) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { error } = await supabase!.from('supplier_updates').delete().eq('id', updateId);
      if (error) throw error;
      await refreshData();
    } catch (error) {
      console.error('Error deleting supplier update:', error);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      suppliers,
      deliveryPartners,
      customers,
      farmers,
      routes,
      pickupLogs,
      deliveries,
      dailyAllocations,
      products,
      orders,
      orderItems,
      supplierUpdates,
      loading,
      error,
      addSupplier,
      addDeliveryPartner,
      addCustomer,
      addFarmer,
      addRoute,
      addPickupLog,
      addDelivery,
      addDailyAllocation,
      assignCustomersToPartner,
      assignRouteToPartner,
      updateDeliveryStatus,
      updateDeliveryQuantity,
      updateCustomerStatus,
      deleteCustomer,
      updateDeliveryPartnerStatus,
      deleteDeliveryPartner,
      logPickup,
      getDailyAllocation,
      getPartnerRoute,
      getRouteCustomers,
      getRouteFarmers,
      updateRemainingQuantity,
      updateSupplierStatus,
      deleteSupplier,
      getPendingSuppliers,
      refreshData,
      addCustomerUser: customerService.addCustomerUser,
      authenticateCustomer: customerService.authenticateCustomer,
      getSupplierPricing: customerService.getSupplierPricing,
      updateSupplierPricing: customerService.updateSupplierPricing,
      getCustomerInvoices: customerService.getCustomerInvoices,
      getInvoiceLineItems: customerService.getInvoiceLineItems,
      addProduct,
      updateProduct,
      deleteProduct,
      addOrder,
      updateOrderStatus,
      addSupplierUpdate,
      updateSupplierUpdate,
      deleteSupplierUpdate
    }}>
      {children}
    </DataContext.Provider>
  );
};