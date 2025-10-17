import React, { useState } from 'react';
import { Users, Truck, ArrowRight, Check, X, UserPlus } from 'lucide-react';
import { useData } from '../context/DataContext';

interface CustomerAssignmentProps {
  supplierId: string;
}

const CustomerAssignment: React.FC<CustomerAssignmentProps> = ({ supplierId }) => {
  const { deliveryPartners, customers, assignCustomersToPartner, refreshData } = useData();
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  const myDeliveryPartners = deliveryPartners.filter(dp => dp.supplierId === supplierId);
  const myCustomers = customers.filter(c => c.supplierId === supplierId);

  const getAssignedCustomers = (partnerId: string) => {
    const partner = myDeliveryPartners.find(dp => dp.id === partnerId);
    return partner?.assignedCustomers || [];
  };

  const getUnassignedCustomers = () => {
    const allAssignedCustomerIds = myDeliveryPartners.flatMap(partner => 
      partner.assignedCustomers || []
    );
    return myCustomers.filter(customer => 
      !allAssignedCustomerIds.includes(customer.id)
    );
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleAssignCustomers = async () => {
    if (!selectedPartner || selectedCustomers.length === 0) return;

    setIsAssigning(true);
    try {
      const currentAssignments = getAssignedCustomers(selectedPartner);
      const newAssignments = [...currentAssignments, ...selectedCustomers];
      
      await assignCustomersToPartner(selectedPartner, newAssignments);
      await refreshData();
      
      setSelectedCustomers([]);
      alert(`Successfully assigned ${selectedCustomers.length} customer(s) to delivery partner!`);
    } catch (error) {
      console.error('Error assigning customers:', error);
      alert('Failed to assign customers. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveCustomer = async (partnerId: string, customerId: string) => {
    try {
      const currentAssignments = getAssignedCustomers(partnerId);
      const newAssignments = currentAssignments.filter(id => id !== customerId);
      
      await assignCustomersToPartner(partnerId, newAssignments);
      await refreshData();
      
      alert('Customer removed from delivery partner successfully!');
    } catch (error) {
      console.error('Error removing customer:', error);
      alert('Failed to remove customer. Please try again.');
    }
  };

  const unassignedCustomers = getUnassignedCustomers();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Customer Assignment</h3>
            <p className="text-sm text-gray-500">Assign customers to delivery partners for efficient milk delivery</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{myCustomers.length}</div>
            <div className="text-sm text-blue-700">Total Customers</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{myDeliveryPartners.length}</div>
            <div className="text-sm text-green-700">Delivery Partners</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{unassignedCustomers.length}</div>
            <div className="text-sm text-yellow-700">Unassigned Customers</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Delivery Partners */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-blue-600" />
              Delivery Partners & Their Customers
            </h4>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {myDeliveryPartners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No delivery partners found</p>
                <p className="text-sm">Add delivery partners first</p>
              </div>
            ) : (
              myDeliveryPartners.map((partner) => {
                const assignedCustomerIds = getAssignedCustomers(partner.id);
                const assignedCustomers = myCustomers.filter(c => assignedCustomerIds.includes(c.id));
                
                return (
                  <div key={partner.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Truck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900">{partner.name}</h5>
                          <p className="text-sm text-gray-500">🚛 {partner.vehicleNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {assignedCustomers.length}
                        </div>
                        <div className="text-xs text-gray-500">customers</div>
                      </div>
                    </div>
                    
                    {assignedCustomers.length > 0 ? (
                      <div className="space-y-2">
                        {assignedCustomers.map((customer) => (
                          <div key={customer.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{customer.name}</div>
                              <div className="text-xs text-gray-500">{customer.dailyQuantity}L daily</div>
                            </div>
                            <button
                              onClick={() => handleRemoveCustomer(partner.id, customer.id)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Remove customer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded">
                        No customers assigned
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side - Assignment Interface */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-600" />
              Assign Customers
            </h4>
          </div>
          <div className="p-6">
            {/* Partner Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Delivery Partner
              </label>
              <select
                value={selectedPartner || ''}
                onChange={(e) => setSelectedPartner(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a delivery partner...</option>
                {myDeliveryPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} - {partner.vehicleNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customers to Assign ({selectedCustomers.length} selected)
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {unassignedCustomers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">All customers are assigned</p>
                  </div>
                ) : (
                  unassignedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedCustomers.includes(customer.id) ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.address}</div>
                          <div className="text-xs text-gray-400">📞 {customer.phone} • 🥛 {customer.dailyQuantity}L daily</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => handleCustomerToggle(customer.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assignment Button */}
            <button
              onClick={handleAssignCustomers}
              disabled={!selectedPartner || selectedCustomers.length === 0 || isAssigning}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAssigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Assigning...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  <span>Assign {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? 's' : ''}</span>
                </>
              )}
            </button>

            {selectedPartner && selectedCustomers.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Ready to assign:</strong> {selectedCustomers.length} customer(s) to{' '}
                  {myDeliveryPartners.find(dp => dp.id === selectedPartner)?.name}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAssignment;