import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, Calendar, MapPin, Truck, Users, CheckCircle, Clock, XCircle, RefreshCw, Droplets, TrendingUp, UserPlus, Milk } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface DeliveryPartnerDashboardProps {
  user: User;
  onLogout: () => void;
}

const DeliveryPartnerDashboard: React.FC<DeliveryPartnerDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/delivery/login');
  };

  const { deliveries, customers, dailyAllocations, deliveryPartners, updateDeliveryStatus, refreshData, addCustomer, addPickupLog, addDelivery, addDailyAllocation, pickupLogs, farmers } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<{[customerId: string]: number}>({});
  const [todayProgress, setTodayProgress] = useState({
    allocated: 0,
    delivered: 0,
    remaining: 0,
    completedDeliveries: 0,
    totalCustomers: 0
  });

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dailyQuantity: 1
  });

  // Milk intake form state
  const [milkIntake, setMilkIntake] = useState({
    farmerId: '',
    quantity: 0,
    qualityGrade: 'A' as 'A' | 'B' | 'C',
    fatContent: 0,
    pricePerLiter: 0,
    notes: ''
  });

  // Temporary delivery form state
  const [tempDelivery, setTempDelivery] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    quantity: 0,
    notes: ''
  });

  // Get current delivery partner info
  const currentPartner = deliveryPartners.find(dp => dp.email === user.email || dp.id === user.id);
  const partnerId = currentPartner?.id || user.id;
  const today = new Date().toISOString().split('T')[0];

  // Get assigned customers
  const assignedCustomerIds = currentPartner?.assignedCustomers || [];
  const assignedCustomers = customers.filter(c => assignedCustomerIds.includes(c.id));

  // Calculate today's progress
  useEffect(() => {
    const calculateProgress = () => {
      // Get all today's allocations and find the most recent one
      const todayAllocations = dailyAllocations.filter(allocation =>
        allocation.deliveryPartnerId === partnerId && allocation.date === today
      );

      const todayAllocation = todayAllocations.length > 0
        ? todayAllocations.reduce((latest, current) =>
            new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest
          )
        : null;

      // Get today's deliveries for this partner
      const todayDeliveries = deliveries.filter(d =>
        d.deliveryPartnerId === partnerId && d.date === today
      );

      // Calculate delivered quantity from completed deliveries
      const completedDeliveries = todayDeliveries.filter(d => d.status === 'completed');
      const deliveredQuantity = completedDeliveries.reduce((sum, d) => sum + d.quantity, 0);

      // Set progress state
      const allocated = todayAllocation?.allocatedQuantity || 0;
      const remaining = allocated - deliveredQuantity;

      setTodayProgress({
        allocated,
        delivered: deliveredQuantity,
        remaining: Math.max(0, remaining),
        completedDeliveries: completedDeliveries.length,
        totalCustomers: assignedCustomers.length
      });
    };

    calculateProgress();
  }, [dailyAllocations, deliveries, partnerId, today, assignedCustomers.length]);

  // Initialize editing quantities when customers change
  useEffect(() => {
    if (assignedCustomers.length > 0) {
      setEditingQuantity(prev => {
        const initialQuantities: {[customerId: string]: number} = { ...prev };
        assignedCustomers.forEach(customer => {
          // Only set if not already set
          if (initialQuantities[customer.id] === undefined) {
            initialQuantities[customer.id] = customer.dailyQuantity;
          }
        });
        return initialQuantities;
      });
    }
  }, [assignedCustomers.length, assignedCustomers.map(c => c.id).join(',')]);

  // Handle quantity change
  const handleQuantityChange = (customerId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingQuantity(prev => ({
      ...prev,
      [customerId]: numValue
    }));
  };

  // Handle delivery completion
  const handleDeliveryComplete = async (customerId: string, customerName: string, defaultQuantity: number) => {
    const quantity = editingQuantity[customerId] || defaultQuantity;

    if (quantity <= 0) {
      alert('❌ Please enter a valid quantity greater than 0');
      return;
    }

    if (todayProgress.remaining < quantity) {
      alert(`❌ Insufficient milk quantity!\n\nTrying to deliver: ${quantity}L\nRemaining: ${todayProgress.remaining}L\n\nContact your supplier for more allocation.`);
      return;
    }

    setIsUpdating(customerId);

    try {
      // Find or create delivery record
      let delivery = deliveries.find(d =>
        d.customerId === customerId &&
        d.deliveryPartnerId === partnerId &&
        d.date === today
      );

      const deliveryId = delivery?.id || `${customerId}_${partnerId}_${today}`;

      // Update delivery status with the edited quantity
      await updateDeliveryStatus(
        deliveryId,
        'completed',
        `✅ Delivered ${quantity}L to ${customerName} on ${today}`,
        quantity
      );

      // Refresh data to get updated state
      await refreshData();

      // Update local progress immediately for better UX
      setTodayProgress(prev => ({
        ...prev,
        delivered: prev.delivered + quantity,
        remaining: Math.max(0, prev.remaining - quantity),
        completedDeliveries: prev.completedDeliveries + 1
      }));

      alert(`✅ DELIVERY COMPLETED!\n\n👤 Customer: ${customerName}\n🥛 Delivered: ${quantity}L\n📊 Remaining: ${todayProgress.remaining - quantity}L`);

    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('❌ Failed to update delivery status. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle delivery failure
  const handleDeliveryFailed = async (customerId: string, customerName: string) => {
    const reason = prompt(`❌ Why did the delivery to ${customerName} fail?\n\nCommon reasons:\n• Customer not available\n• Address not found\n• Customer refused delivery\n• Vehicle breakdown\n• Other`, 'Customer not available');
    
    if (!reason) return;

    setIsUpdating(customerId);

    try {
      // Find or create delivery record
      let delivery = deliveries.find(d => 
        d.customerId === customerId && 
        d.deliveryPartnerId === partnerId && 
        d.date === today
      );

      const deliveryId = delivery?.id || `${customerId}_${partnerId}_${today}`;

      // Update delivery status
      await updateDeliveryStatus(
        deliveryId, 
        'cancelled', 
        `❌ Failed delivery to ${customerName}: ${reason}`
      );

      // Refresh data
      await refreshData();

      alert(`❌ DELIVERY MARKED AS FAILED!\n\n👤 Customer: ${customerName}\n📝 Reason: ${reason}\n\n💡 No milk quantity deducted from allocation.`);

    } catch (error) {
      console.error('Error marking delivery as failed:', error);
      alert('❌ Failed to update delivery status. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Get delivery status for a customer
  const getDeliveryStatus = (customerId: string) => {
    const delivery = deliveries.find(d =>
      d.customerId === customerId &&
      d.deliveryPartnerId === partnerId &&
      d.date === today
    );
    return delivery?.status || 'pending';
  };

  // Handle add new customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCustomer.name || !newCustomer.phone || !newCustomer.address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsUpdating('adding-customer');

      await addCustomer({
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        supplierId: currentPartner?.supplierId || '',
        dailyQuantity: newCustomer.dailyQuantity
      });

      alert(`Customer "${newCustomer.name}" added successfully!`);

      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        dailyQuantity: 1
      });

      await refreshData();
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle record milk intake
  const handleRecordMilkIntake = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!milkIntake.farmerId || milkIntake.quantity <= 0 || milkIntake.pricePerLiter <= 0) {
      alert('Please select a farmer and enter valid quantity and price');
      return;
    }

    try {
      setIsUpdating('recording-intake');

      const totalAmount = milkIntake.quantity * milkIntake.pricePerLiter;

      await addPickupLog({
        farmerId: milkIntake.farmerId,
        supplierId: currentPartner?.supplierId || '',
        deliveryPartnerId: partnerId,
        quantity: milkIntake.quantity,
        qualityGrade: milkIntake.qualityGrade,
        fatContent: milkIntake.fatContent,
        pricePerLiter: milkIntake.pricePerLiter,
        totalAmount: totalAmount,
        date: today,
        pickupTime: new Date().toISOString(),
        status: 'completed',
        notes: milkIntake.notes,
        createdAt: new Date().toISOString()
      });

      const todayAllocations = dailyAllocations.filter(
        a => a.deliveryPartnerId === partnerId && a.date === today
      );

      const existingAllocation = todayAllocations.length > 0
        ? todayAllocations.reduce((latest, current) =>
            new Date(current.createdAt || 0) > new Date(latest.createdAt || 0) ? current : latest
          )
        : null;

      const newAllocated = (existingAllocation?.allocatedQuantity || 0) + milkIntake.quantity;
      const newRemaining = (existingAllocation?.remainingQuantity || 0) + milkIntake.quantity;

      await addDailyAllocation({
        supplierId: currentPartner?.supplierId || '',
        deliveryPartnerId: partnerId,
        date: today,
        allocatedQuantity: newAllocated,
        remainingQuantity: newRemaining,
        status: 'allocated'
      });

      const farmer = farmers.find(f => f.id === milkIntake.farmerId);
      alert(`Milk intake recorded!\n\nFarmer: ${farmer?.name}\nQuantity: ${milkIntake.quantity}L\nQuality: ${milkIntake.qualityGrade}\nPrice: ₹${milkIntake.pricePerLiter}/L\nTotal: ₹${totalAmount.toFixed(2)}\n\nYour allocated milk has been increased by ${milkIntake.quantity}L`);

      setMilkIntake({
        farmerId: '',
        quantity: 0,
        qualityGrade: 'A',
        fatContent: 0,
        pricePerLiter: 0,
        notes: ''
      });

      await refreshData();
    } catch (error) {
      console.error('Error recording milk intake:', error);
      alert('Failed to record milk intake. Please try again.');
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle temporary delivery
  const handleTemporaryDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempDelivery.customerName || !tempDelivery.customerPhone || tempDelivery.quantity <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (todayProgress.remaining < tempDelivery.quantity) {
      alert(`Insufficient milk quantity!\n\nTrying to deliver: ${tempDelivery.quantity}L\nRemaining: ${todayProgress.remaining}L`);
      return;
    }

    try {
      setIsUpdating('temp-delivery');

      const tempCustomer = await addCustomer({
        name: `[TEMP] ${tempDelivery.customerName}`,
        email: `temp_${Date.now()}@temporary.com`,
        phone: tempDelivery.customerPhone,
        address: tempDelivery.customerAddress || 'Temporary address',
        supplierId: currentPartner?.supplierId || '',
        dailyQuantity: 0
      });

      if (!tempCustomer) {
        throw new Error('Failed to create temporary customer');
      }

      await addDelivery({
        customerId: tempCustomer.id,
        deliveryPartnerId: partnerId,
        supplierId: currentPartner?.supplierId || '',
        quantity: tempDelivery.quantity,
        suggestedQuantity: tempDelivery.quantity,
        date: today,
        status: 'completed',
        scheduledTime: new Date().toISOString(),
        completedTime: new Date().toISOString(),
        notes: `TEMPORARY DELIVERY - ${tempDelivery.notes || 'One-time delivery'}`
      });

      alert(`Temporary delivery recorded!\n\nCustomer: ${tempDelivery.customerName}\nQuantity: ${tempDelivery.quantity}L`);

      setTempDelivery({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        quantity: 0,
        notes: ''
      });

      await refreshData();
    } catch (error) {
      console.error('Error recording temporary delivery:', error);
      alert(`Failed to record temporary delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(null);
    }
  };

  // Calculate progress percentage
  const progressPercentage = todayProgress.allocated > 0 
    ? Math.round((todayProgress.delivered / todayProgress.allocated) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Delivery Partner Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Allocation Progress Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Today's Milk Allocation</h2>
              <p className="text-blue-100">
                Allocated: {todayProgress.allocated}L | 
                Delivered: {todayProgress.delivered}L | 
                Remaining: {todayProgress.remaining}L
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{todayProgress.allocated}L</div>
              <div className="text-blue-100">Total Allocated</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-blue-300 bg-opacity-50 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-300 rounded-full h-4 transition-all duration-500"
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-blue-100 mt-2">
              <span>{todayProgress.completedDeliveries} of {todayProgress.totalCustomers} deliveries completed</span>
              <span>{progressPercentage}% Complete</span>
            </div>
            {progressPercentage === 100 && todayProgress.totalCustomers > 0 && (
              <div className="mt-2 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  🎉 All deliveries completed for today!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-8 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'deliveries'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Deliveries
          </button>
          <button
            onClick={() => setActiveTab('add-customer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'add-customer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Add Customer
          </button>
          <button
            onClick={() => setActiveTab('milk-intake')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'milk-intake'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Milk Intake
          </button>
          <button
            onClick={() => setActiveTab('temp-delivery')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'temp-delivery'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Temp Delivery
          </button>
        </nav>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-blue-50">
                    <Droplets className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.allocated}L</h3>
                    <p className="text-sm text-gray-500">Today's Allocation</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.delivered}L</h3>
                    <p className="text-sm text-gray-500">Delivered</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-yellow-50">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.remaining}L</h3>
                    <p className="text-sm text-gray-500">Remaining</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-md bg-purple-50">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{todayProgress.completedDeliveries}/{todayProgress.totalCustomers}</h3>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                <button
                  onClick={refreshData}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh Data</span>
                </button>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• View and manage customer deliveries in the "Deliveries" tab</p>
                <p>• Mark deliveries as completed or failed</p>
                <p>• Track your progress with the real-time progress bar</p>
                <p>• Your remaining milk quantity updates automatically</p>
              </div>
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Today's Deliveries</h3>
                    <p className="text-sm text-gray-500">Manage your customer deliveries for {today}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{assignedCustomers.length}</div>
                  <div className="text-sm text-gray-500">Total Customers</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {assignedCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Assigned</h3>
                  <p>You don't have any customers assigned for delivery.</p>
                  <p className="text-sm mt-2">Contact your supplier to get customer assignments.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {assignedCustomers.map((customer) => {
                    const status = getDeliveryStatus(customer.id);
                    const isCompleted = status === 'completed';
                    const isFailed = status === 'cancelled';
                    const isPending = status === 'pending';
                    
                    return (
                      <div key={customer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-xl font-semibold text-gray-900">{customer.name}</h4>
                              <div className="space-y-1 mt-2">
                                <p className="text-sm text-gray-600 flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                  {customer.address}
                                </p>
                                <p className="text-sm text-gray-600">📱 {customer.phone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-2">Default: {customer.dailyQuantity}L</div>
                            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                              isCompleted
                                ? 'bg-green-100 text-green-800'
                                : isFailed
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isCompleted ? '✅ Completed' : isFailed ? '❌ Failed' : '⏳ Pending'}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Editor */}
                        {!isCompleted && !isFailed && (
                          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <label className="block text-sm font-medium text-blue-900 mb-2">
                              Delivery Quantity (Liters)
                            </label>
                            <div className="flex items-center space-x-3">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={editingQuantity[customer.id] !== undefined ? editingQuantity[customer.id] : customer.dailyQuantity}
                                onChange={(e) => handleQuantityChange(customer.id, e.target.value)}
                                disabled={isUpdating === customer.id}
                                className="flex-1 px-4 py-3 text-lg font-semibold border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Enter quantity"
                              />
                              <div className="flex flex-col space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = editingQuantity[customer.id] !== undefined ? editingQuantity[customer.id] : customer.dailyQuantity;
                                    handleQuantityChange(customer.id, String(current + 0.5));
                                  }}
                                  disabled={isUpdating === customer.id}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  +0.5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = editingQuantity[customer.id] !== undefined ? editingQuantity[customer.id] : customer.dailyQuantity;
                                    handleQuantityChange(customer.id, String(Math.max(0, current - 0.5)));
                                  }}
                                  disabled={isUpdating === customer.id}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  -0.5
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-blue-700">
                              <span>Default quantity: {customer.dailyQuantity}L</span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(customer.id, String(customer.dailyQuantity))}
                                disabled={isUpdating === customer.id}
                                className="text-blue-600 hover:text-blue-800 font-medium underline disabled:opacity-50"
                              >
                                Reset to default
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-6">
                          <button
                            onClick={() => handleDeliveryComplete(customer.id, customer.name, customer.dailyQuantity)}
                            disabled={isCompleted || isUpdating === customer.id}
                            className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                              isCompleted
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isUpdating === customer.id
                                ? 'bg-blue-500 text-white cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg transform hover:scale-105'
                            }`}
                          >
                            {isUpdating === customer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-6 w-6" />
                                <span>{isCompleted ? 'Completed ✓' : 'Mark Completed'}</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleDeliveryFailed(customer.id, customer.name)}
                            disabled={isFailed || isUpdating === customer.id}
                            className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                              isFailed
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : isUpdating === customer.id
                                ? 'bg-blue-500 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:scale-105'
                            }`}
                          >
                            {isUpdating === customer.id ? (
                              <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-6 w-6" />
                                <span>{isFailed ? 'Failed ✗' : 'Mark Failed'}</span>
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Status Message */}
                        {(isCompleted || isFailed) && (
                          <div className="mt-4 p-3 bg-white rounded-lg border">
                            <div className="text-sm font-medium text-gray-700">
                              {isCompleted ? (
                                (() => {
                                  const delivery = deliveries.find(d =>
                                    d.customerId === customer.id &&
                                    d.deliveryPartnerId === partnerId &&
                                    d.date === today
                                  );
                                  const deliveredQty = delivery?.quantity || customer.dailyQuantity;
                                  return `✅ Delivery completed successfully - ${deliveredQty}L delivered`;
                                })()
                              ) :
                                '❌ Delivery failed - No quantity deducted from allocation'}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Customer Tab */}
        {activeTab === 'add-customer' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Add New Customer</h3>
                <p className="text-sm text-gray-500">Register a new customer for your supplier</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer address"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Quantity (Liters)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newCustomer.dailyQuantity}
                  onChange={(e) => setNewCustomer({ ...newCustomer, dailyQuantity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating === 'adding-customer'}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating === 'adding-customer' ? 'Adding Customer...' : 'Add Customer'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewCustomer({ name: '', email: '', phone: '', address: '', dailyQuantity: 1 })}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Milk Intake Tab */}
        {activeTab === 'milk-intake' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Milk className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Record Milk Intake</h3>
                <p className="text-sm text-gray-500">Log milk collected from farmers</p>
              </div>
            </div>

            <form onSubmit={handleRecordMilkIntake} className="mb-8 space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Farmer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={milkIntake.farmerId}
                    onChange={(e) => setMilkIntake({ ...milkIntake, farmerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a farmer</option>
                    {farmers
                      .filter(f => f.supplierId === currentPartner?.supplierId && f.status === 'active')
                      .map(farmer => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.name} - {farmer.phone}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (Liters) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={milkIntake.quantity || ''}
                    onChange={(e) => setMilkIntake({ ...milkIntake, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quantity"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={milkIntake.qualityGrade}
                    onChange={(e) => setMilkIntake({ ...milkIntake, qualityGrade: e.target.value as 'A' | 'B' | 'C' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Basic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat Content (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={milkIntake.fatContent || ''}
                    onChange={(e) => setMilkIntake({ ...milkIntake, fatContent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Fat percentage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Liter (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={milkIntake.pricePerLiter || ''}
                    onChange={(e) => setMilkIntake({ ...milkIntake, pricePerLiter: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Price per liter"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="text"
                    value={`₹${(milkIntake.quantity * milkIntake.pricePerLiter).toFixed(2)}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={milkIntake.notes}
                    onChange={(e) => setMilkIntake({ ...milkIntake, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes (optional)"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isUpdating === 'recording-intake'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating === 'recording-intake' ? 'Recording...' : 'Record Milk Intake'}
                </button>
                <button
                  type="button"
                  onClick={() => setMilkIntake({ farmerId: '', quantity: 0, qualityGrade: 'A', fatContent: 0, pricePerLiter: 0, notes: '' })}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Today's Pickup Logs */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Today's Milk Collection ({pickupLogs.filter(p => p.deliveryPartnerId === partnerId && p.date === today).length})</h4>
              <div className="space-y-3">
                {pickupLogs
                  .filter(p => p.deliveryPartnerId === partnerId && p.date === today)
                  .map(log => {
                    const farmer = farmers.find(f => f.id === log.farmerId);
                    return (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{farmer?.name || 'Unknown Farmer'}</p>
                          <p className="text-sm text-gray-500">Quality: {log.qualityGrade} | Fat: {log.fatContent}% | {log.notes}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-blue-600">{log.quantity}L</p>
                          <p className="text-sm text-gray-600">₹{log.pricePerLiter}/L</p>
                          <p className="text-sm font-semibold text-green-600">₹{log.totalAmount.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                {pickupLogs.filter(p => p.deliveryPartnerId === partnerId && p.date === today).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No milk intake recorded today</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Temporary Delivery Tab */}
        {activeTab === 'temp-delivery' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Temporary Delivery</h3>
                <p className="text-sm text-gray-500">Record one-time delivery to non-registered customer</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Temporary deliveries are for one-time customers.
                The quantity will be deducted from your remaining allocation.
                <br />
                <strong>Remaining: {todayProgress.remaining}L</strong>
              </p>
            </div>

            <form onSubmit={handleTemporaryDelivery} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tempDelivery.customerName}
                  onChange={(e) => setTempDelivery({ ...tempDelivery, customerName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={tempDelivery.customerPhone}
                  onChange={(e) => setTempDelivery({ ...tempDelivery, customerPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={tempDelivery.customerAddress}
                  onChange={(e) => setTempDelivery({ ...tempDelivery, customerAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter delivery address (optional)"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (Liters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={tempDelivery.quantity || ''}
                  onChange={(e) => setTempDelivery({ ...tempDelivery, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter quantity in liters"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={tempDelivery.notes}
                  onChange={(e) => setTempDelivery({ ...tempDelivery, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Any additional notes (optional)"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating === 'temp-delivery'}
                  className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating === 'temp-delivery' ? 'Recording...' : 'Record Temporary Delivery'}
                </button>
                <button
                  type="button"
                  onClick={() => setTempDelivery({ customerName: '', customerPhone: '', customerAddress: '', quantity: 0, notes: '' })}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </form>

            {/* Recent Temp Deliveries */}
            <div className="mt-8 pt-8 border-t">
              <h4 className="font-semibold text-gray-900 mb-4">Today's Temporary Deliveries</h4>
              <div className="space-y-3">
                {deliveries
                  .filter(d => {
                    const customer = customers.find(c => c.id === d.customerId);
                    return d.deliveryPartnerId === partnerId &&
                           d.date === today &&
                           d.status === 'completed' &&
                           customer?.name.startsWith('[TEMP]');
                  })
                  .map(delivery => {
                    const customer = customers.find(c => c.id === delivery.customerId);
                    return (
                      <div key={delivery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{customer?.name.replace('[TEMP] ', '') || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{customer?.phone} - {delivery.notes}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">{delivery.quantity}L</p>
                          <p className="text-xs text-gray-500">{delivery.completedTime ? new Date(delivery.completedTime).toLocaleTimeString() : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                {deliveries.filter(d => {
                  const customer = customers.find(c => c.id === d.customerId);
                  return d.deliveryPartnerId === partnerId && d.date === today && customer?.name.startsWith('[TEMP]');
                }).length === 0 && (
                  <p className="text-center text-gray-500 py-4">No temporary deliveries recorded today</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryPartnerDashboard;