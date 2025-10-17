import React, { useState, useEffect } from 'react';
import { DollarSign, Save, X } from 'lucide-react';
import { useData } from '../context/DataContext';

interface SupplierPricingProps {
  supplierId: string;
  onClose?: () => void;
}

const SupplierPricing: React.FC<SupplierPricingProps> = ({ supplierId, onClose }) => {
  const { getSupplierPricing, updateSupplierPricing } = useData();
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurrentPricing();
  }, [supplierId]);

  const loadCurrentPricing = async () => {
    try {
      setIsLoading(true);
      const pricing = await getSupplierPricing(supplierId);
      if (pricing) {
        setCurrentPrice(pricing.pricePerLiter);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      setError('Failed to load current pricing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await updateSupplierPricing(supplierId, parseFloat(newPrice));
      setCurrentPrice(parseFloat(newPrice));
      setNewPrice('');
      setIsEditing(false);
      alert('Pricing updated successfully!');
    } catch (error: any) {
      console.error('Error updating pricing:', error);
      setError('Failed to update pricing. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNewPrice('');
    setError('');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-md mr-3">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Milk Pricing Configuration</h3>
            <p className="text-sm text-gray-500">Set your price per liter for customer invoices</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {currentPrice !== null && !isEditing && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Price Per Liter</p>
                <p className="text-3xl font-bold text-green-700">₹{currentPrice.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  This price will be used for calculating monthly customer invoices
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setNewPrice(currentPrice.toString());
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Price
              </button>
            </div>
          </div>
        )}

        {(currentPrice === null || isEditing) && (
          <div className="p-4 border border-gray-200 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentPrice === null ? 'Set Initial Price Per Liter (₹)' : 'New Price Per Liter (₹)'}
            </label>
            <div className="flex space-x-3">
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => {
                  setNewPrice(e.target.value);
                  setError('');
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price (e.g., 50.00)"
              />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              {isEditing && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              {currentPrice === null
                ? 'This price will be used for calculating all customer invoices. You can update it anytime.'
                : 'The new price will apply to all future invoices. Past invoices will not be affected.'}
            </p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Important Notes:</h4>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Price changes only affect future invoices, not historical ones</li>
            <li>Monthly invoices are automatically generated based on deliveries</li>
            <li>Customers will see this price in their monthly invoice breakdown</li>
            <li>Make sure to communicate price changes to your customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SupplierPricing;
