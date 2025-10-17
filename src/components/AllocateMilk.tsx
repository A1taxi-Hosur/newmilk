import React, { useState } from 'react';
import { Calendar, Truck, Droplets, Plus, Check } from 'lucide-react';
import { useData } from '../context/DataContext';

interface AllocateMilkProps {
  supplierId: string;
}

const AllocateMilk: React.FC<AllocateMilkProps> = ({ supplierId }) => {
  const { deliveryPartners, customers, addDelivery, addDailyAllocation } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [allocatedQuantity, setAllocatedQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAllocations, setCompletedAllocations] = useState<Set<string>>(new Set());

  const myDeliveryPartners = deliveryPartners.filter(dp => dp.supplierId === supplierId);
  const myCustomers = customers.filter(c => c.supplierId === supplierId);

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartner(partnerId);
    setAllocatedQuantity('');
  };


  const handleAllocateToPartner = async () => {
    if (!selectedPartner || !allocatedQuantity) return;
    
    const partner = myDeliveryPartners.find(dp => dp.id === selectedPartner);
    const assignedCustomers = myCustomers.filter(customer => 
      partner?.assignedCustomers?.includes(customer.id)
    );
    
    if (assignedCustomers.length === 0) {
      alert('This delivery partner has no assigned customers. Please assign customers first in the Customer Assignment tab.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create daily allocation
      addDailyAllocation({
        supplierId,
        deliveryPartnerId: selectedPartner,
        date: selectedDate,
        allocatedQuantity: parseInt(allocatedQuantity),
        remainingQuantity: parseInt(allocatedQuantity),
        status: 'allocated',
        createdAt: new Date().toISOString()
      });

      // Create delivery records for selected customers
      for (const customer of assignedCustomers) {
        if (customer) {
          addDelivery({
            customerId: customer.id,
            deliveryPartnerId: selectedPartner,
            supplierId,
            quantity: customer.dailyQuantity,
            date: selectedDate,
            status: 'pending',
            scheduledTime: '08:00 AM'
          });
        }
      }

      // Mark this partner as completed
      setCompletedAllocations(prev => new Set([...prev, selectedPartner]));
      
      // Reset form
      setSelectedPartner(null);
      setAllocatedQuantity('');

      alert(`Allocation completed for ${myDeliveryPartners.find(dp => dp.id === selectedPartner)?.name}!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssignedCustomersRequirement = (partnerId: string): number => {
    const partner = myDeliveryPartners.find(dp => dp.id === partnerId);
    const assignedCustomers = myCustomers.filter(customer => 
      partner?.assignedCustomers?.includes(customer.id)
    );
    return assignedCustomers.reduce((total, customer) => total + customer.dailyQuantity, 0);
  };

  const getAssignedCustomers = (partnerId: string) => {
    const partner = myDeliveryPartners.find(dp => dp.id === partnerId);
    return myCustomers.filter(c => partner?.assignedCustomers?.includes(c.id));
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Droplets className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Milk Allocation</h2>
            <p className="text-sm text-gray-500">Allocate milk to each delivery partner individually</p>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Allocation Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required
            />
          </div>
          <div className="ml-auto text-right">
            <div className="text-lg font-bold text-blue-600">
              {completedAllocations.size} / {myDeliveryPartners.length}
            </div>
            <div className="text-sm text-gray-500">Partners Allocated</div>
          </div>
        </div>
      </div>

      {myDeliveryPartners.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Partners</h3>
          <p className="text-gray-500 mb-4">Add delivery partners first to allocate milk</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Delivery Partners List */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Truck className="h-5 w-5 mr-2 text-gray-600" />
              Select Delivery Partner
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {myDeliveryPartners.map((partner) => {
                const isCompleted = completedAllocations.has(partner.id);
                const isSelected = selectedPartner === partner.id;
                const assignedCustomers = getAssignedCustomers(partner.id);

                return (
                  <div
                    key={partner.id}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      isCompleted
                        ? 'border-green-300 bg-green-50'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    }`}
                    onClick={() => !isCompleted && handlePartnerSelect(partner.id)}
                  >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-100' : isSelected ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {isCompleted ? (
                              <Check className="h-5 w-5 text-green-600" />
                            ) : (
                              <Truck className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900">{partner.name}</h5>
                            <div className="text-sm text-gray-600">
                              🚛 {partner.vehicleNumber} • 📱 {partner.phone}
                            </div>
                            <div className="text-sm text-gray-500">
                              👥 {assignedCustomers.length} customer{assignedCustomers.length !== 1 ? 's' : ''} assigned
                              {assignedCustomers.length > 0 && (
                                <span className="ml-2 text-blue-600">
                                  • {getAssignedCustomersRequirement(partner.id)}L total requirement
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="text-green-600 font-medium text-sm">
                            ✓ Allocated
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allocation Form */}
            <div>
              {selectedPartner ? (
                (() => {
                  const partner = myDeliveryPartners.find(dp => dp.id === selectedPartner);
                  const assignedCustomers = getAssignedCustomers(selectedPartner);
                  const totalRequirement = getAssignedCustomersRequirement(selectedPartner);
                  
                  return (
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Allocate to {partner?.name}
                      </h4>

                      {assignedCustomers.length === 0 ? (
                        <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-yellow-600 mb-2">⚠️ No Customers Assigned</div>
                          <p className="text-sm text-gray-600 mb-4">
                            This delivery partner has no assigned customers.
                          </p>
                          <p className="text-sm text-blue-600">
                            Go to the <strong>Customer Assignment</strong> tab to assign customers first.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Customer Summary */}
                          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-2">Assigned Customers ({assignedCustomers.length})</h5>
                            <div className="space-y-1">
                              {assignedCustomers.map((customer) => (
                                <div key={customer.id} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{customer.name}</span>
                                  <span className="text-blue-600 font-medium">{customer.dailyQuantity}L</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-blue-300 mt-2 pt-2">
                              <div className="flex justify-between font-semibold text-blue-900">
                                <span>Total Daily Requirement:</span>
                                <span>{totalRequirement}L</span>
                              </div>
                            </div>
                          </div>

                          {/* Milk Quantity Input */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Milk Allocation (Liters)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={allocatedQuantity}
                              onChange={(e) => setAllocatedQuantity(e.target.value)}
                              className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Recommended: ${totalRequirement}L (total requirement)`}
                            />
                            {allocatedQuantity && parseInt(allocatedQuantity) !== totalRequirement && (
                              <div className="mt-2 text-sm">
                                {parseInt(allocatedQuantity) < totalRequirement ? (
                                  <span className="text-yellow-600">
                                    ⚠️ Allocation is {totalRequirement - parseInt(allocatedQuantity)}L less than total requirement
                                  </span>
                                ) : (
                                  <span className="text-green-600">
                                    ✓ Allocation is {parseInt(allocatedQuantity) - totalRequirement}L more than requirement
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Allocate Button */}
                      <button
                        onClick={handleAllocateToPartner}
                        disabled={isSubmitting || !allocatedQuantity || assignedCustomers.length === 0}
                        className="w-full py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Allocating...
                          </span>
                        ) : (
                          `Allocate ${allocatedQuantity || '0'}L to ${assignedCustomers.length} customers`
                        )}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Select a Delivery Partner</h4>
                  <p className="text-gray-500">Choose a delivery partner from the list to start allocation</p>
                </div>
              )}
            </div>
          </div>
      )}

      {/* Summary */}
      {completedAllocations.size > 0 && (
        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
          <div className="text-sm text-green-600 font-medium">
            ✓ {completedAllocations.size} partner(s) allocated successfully
          </div>
          {completedAllocations.size === myDeliveryPartners.length && myDeliveryPartners.length > 0 && (
            <div className="py-2 px-6 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              All Partners Allocated! 🎉
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AllocateMilk;