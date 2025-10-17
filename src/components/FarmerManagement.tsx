import React, { useState } from 'react';
import { Plus, X, Trash2, UserPlus } from 'lucide-react';
import { useData } from '../context/DataContext';

interface FarmerManagementProps {
  supplierId: string;
}

const FarmerManagement: React.FC<FarmerManagementProps> = ({ supplierId }) => {
  const { farmers, addFarmer, deleteFarmer } = useData();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const myFarmers = farmers.filter(f => f.supplierId === supplierId);

  const generatePassword = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  React.useEffect(() => {
    if (showModal && !formData.password) {
      setFormData(prev => ({ ...prev, password: generatePassword() }));
    }
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await addFarmer({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        supplierId: supplierId,
        password: formData.password,
        status: 'active'
      });

      alert(`Farmer "${formData.name}" added successfully!\n\nLogin credentials:\nEmail: ${formData.email}\nPassword: ${formData.password}`);
      handleCloseModal();
    } catch (error: any) {
      console.error('Error adding farmer:', error);
      setError(error.message || 'Failed to add farmer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      password: ''
    });
    setError('');
  };

  const handleDelete = async (farmerId: string, farmerName: string) => {
    if (window.confirm(`Are you sure you want to delete farmer "${farmerName}"?`)) {
      await deleteFarmer(farmerId);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Farmers Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Farmer</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Farmers</p>
            <p className="text-2xl font-bold text-green-600">{myFarmers.length}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Active Farmers</p>
            <p className="text-2xl font-bold text-blue-600">
              {myFarmers.filter(f => f.status === 'active').length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Inactive Farmers</p>
            <p className="text-2xl font-bold text-gray-600">
              {myFarmers.filter(f => f.status !== 'active').length}
            </p>
          </div>
        </div>
      </div>

      {myFarmers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No farmers yet</h3>
          <p className="text-gray-500 mb-6">Add your first farmer to start collecting milk</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Farmer</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myFarmers.map(farmer => (
            <div key={farmer.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{farmer.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  farmer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {farmer.status}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{farmer.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{farmer.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{farmer.address}</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(farmer.id, farmer.name)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Add Farmer</h3>
                  <p className="text-sm text-gray-500">Register a new farmer</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter farmer's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter complete address"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-2">Login Credentials</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">Username:</span>
                    <span className="ml-2 text-green-900">{formData.email || 'Enter email above'}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Password:</span>
                    <span className="ml-2 text-green-900 font-mono">{formData.password}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerManagement;
