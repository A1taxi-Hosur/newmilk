import React, { useState } from 'react';
import { Plus, X, Eye, EyeOff, RefreshCw, Truck, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';

interface AddDeliveryPartnerProps {
  supplierId: string;
}

const AddDeliveryPartner: React.FC<AddDeliveryPartnerProps> = ({ supplierId }) => {
  const { addDeliveryPartner, deliveryPartners, deleteDeliveryPartner } = useData();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleNumber: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supplierPartners = deliveryPartners.filter(dp => dp.supplierId === supplierId);

  const generatePassword = () => {
    const password = Math.random().toString(36).substr(2, 8);
    setFormData(prev => ({ ...prev, password }));
  };

  React.useEffect(() => {
    if (showModal && !formData.password) {
      generatePassword();
    }
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await addDeliveryPartner({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        supplierId: supplierId,
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        password: formData.password,
        status: 'active'
      });

      alert(`Delivery partner "${formData.name}" added successfully!\n\nLogin credentials:\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nThey can now login using these credentials.`);

      handleCloseModal();
    } catch (error: any) {
      console.error('Error adding delivery partner:', error);
      setError(error.message || 'Failed to add delivery partner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      vehicleNumber: '',
      password: ''
    });
    setError('');
    setShowPassword(false);
  };

  const handleDelete = async (partnerId: string, partnerName: string) => {
    if (window.confirm(`Are you sure you want to delete delivery partner "${partnerName}"?`)) {
      await deleteDeliveryPartner(partnerId);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Delivery Partners Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Partner</span>
        </button>
      </div>

      {supplierPartners.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery partners yet</h3>
          <p className="text-gray-500 mb-6">Add your first delivery partner to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Partner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierPartners.map(partner => (
            <div key={partner.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {partner.status}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{partner.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{partner.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{partner.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Assigned Customers</p>
                  <p className="font-medium text-gray-900">{partner.assignedCustomers?.length || 0}</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(partner.id, partner.name)}
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Add Delivery Partner</h3>
                  <p className="text-sm text-gray-500">Register a new delivery partner</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter partner's full name"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  required
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter vehicle registration number"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-900">Login Credentials</h4>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Generate New</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Username (Email)
                    </label>
                    <div className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md bg-white font-mono text-blue-900">
                      {formData.email || 'Enter email above'}
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className={`w-full px-3 py-2 pr-10 text-sm border border-blue-200 rounded-md bg-white font-mono text-blue-900`}>
                        {showPassword ? formData.password : '•'.repeat(formData.password.length)}
                      </div>
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-blue-400" />
                        )}
                      </button>
                    </div>
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
                  disabled={isSubmitting || !formData.name || !formData.email || !formData.phone || !formData.vehicleNumber}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDeliveryPartner;
