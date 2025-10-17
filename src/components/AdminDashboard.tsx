import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Building2, Truck, UserCheck, Package, Search, Ban, Trash2, CheckCircle, XCircle, Eye, Menu, X as XIcon, Plus } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { suppliers, deliveryPartners, customers, farmers, deliveries, updateSupplierStatus, deleteSupplier, addSupplier, deleteCustomer, deleteDeliveryPartner } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    address: '',
    licenseNumber: '',
    totalCapacity: ''
  });

  const handleLogout = () => {
    onLogout();
    navigate('/admin/login');
  };

  const handleSupplierAction = async (supplierId: string, action: 'approved' | 'rejected') => {
    if (window.confirm(`Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} this supplier?`)) {
      await updateSupplierStatus(supplierId, action);
    }
  };

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      await deleteCustomer(customerId);
    }
  };

  const handleDeleteDeliveryPartner = async (partnerId: string, partnerName: string) => {
    if (window.confirm(`Are you sure you want to delete delivery partner "${partnerName}"? This action cannot be undone.`)) {
      await deleteDeliveryPartner(partnerId);
    }
  };

  const handleDeleteSupplier = async (supplierId: string, supplierName: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${supplierName}"? This will also delete all associated data (delivery partners, customers, farmers). This action cannot be undone.`)) {
      try {
        await deleteSupplier(supplierId);
        alert('Supplier deleted successfully');
      } catch (error) {
        alert('Failed to delete supplier. Please try again.');
      }
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSupplierData.name || !newSupplierData.email || !newSupplierData.username ||
        !newSupplierData.password || !newSupplierData.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addSupplier({
        name: newSupplierData.name,
        email: newSupplierData.email,
        username: newSupplierData.username,
        password: newSupplierData.password,
        phone: newSupplierData.phone,
        address: newSupplierData.address,
        licenseNumber: newSupplierData.licenseNumber,
        totalCapacity: parseInt(newSupplierData.totalCapacity) || 0,
        status: 'approved',
        registrationDate: new Date().toISOString()
      });

      setShowAddSupplierModal(false);
      setNewSupplierData({
        name: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        address: '',
        licenseNumber: '',
        totalCapacity: ''
      });
      alert('Supplier added successfully! Credentials:\nUsername: ' + newSupplierData.username + '\nPassword: ' + newSupplierData.password);
    } catch (error) {
      alert('Failed to add supplier. Please try again.');
    }
  };

  const stats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.status === 'approved').length,
    pendingSuppliers: suppliers.filter(s => s.status === 'pending').length,
    totalDeliveryPartners: deliveryPartners.length,
    totalCustomers: customers.length,
    totalFarmers: farmers.length,
    totalDeliveries: deliveries.length,
    completedDeliveries: deliveries.filter(d => d.status === 'completed').length,
    pendingDeliveries: deliveries.filter(d => d.status === 'pending').length
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'delivery-partners', label: 'Delivery Partners', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'farmers', label: 'Farmers', icon: UserCheck }
  ];

  const renderOverview = () => (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-md bg-blue-50">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Suppliers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSuppliers}</p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Active: {stats.activeSuppliers}</span>
            <span className="text-yellow-600">Pending: {stats.pendingSuppliers}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-md bg-green-50">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Delivery Partners</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDeliveryPartners}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-md bg-purple-50">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-md bg-orange-50">
              <UserCheck className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Farmers</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalFarmers}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Total Deliveries</p>
              <p className="text-sm text-gray-500">{stats.totalDeliveries} deliveries recorded</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600">Completed: {stats.completedDeliveries}</p>
              <p className="text-sm text-yellow-600">Pending: {stats.pendingDeliveries}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuppliers = () => {
    const filteredSuppliers = suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    );

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Suppliers Management</h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{supplier.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      supplier.status === 'approved' ? 'bg-green-100 text-green-800' :
                      supplier.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {supplier.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{supplier.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{supplier.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{supplier.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">License Number</p>
                      <p className="font-medium text-gray-900">{supplier.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Capacity</p>
                      <p className="font-medium text-gray-900">{supplier.totalCapacity} L/day</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Registration Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(supplier.registrationDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setSelectedSupplier(selectedSupplier?.id === supplier.id ? null : supplier)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>{selectedSupplier?.id === supplier.id ? 'Hide Details' : 'View Details'}</span>
                    </button>
                  </div>

                  {selectedSupplier?.id === supplier.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Associated Data</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Delivery Partners</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {deliveryPartners.filter(dp => dp.supplierId === supplier.id).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Customers</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {customers.filter(c => c.supplierId === supplier.id).length}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Farmers</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {farmers.filter(f => f.supplierId === supplier.id).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  {supplier.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleSupplierAction(supplier.id, 'approved')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleSupplierAction(supplier.id, 'rejected')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                  {supplier.status === 'approved' && (
                    <button
                      onClick={() => handleSupplierAction(supplier.id, 'rejected')}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Hold</span>
                    </button>
                  )}
                  {supplier.status === 'rejected' && (
                    <button
                      onClick={() => handleSupplierAction(supplier.id, 'approved')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Activate</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors border border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredSuppliers.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDeliveryPartners = () => {
    const filteredPartners = deliveryPartners.filter(dp =>
      dp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dp.phone.includes(searchTerm)
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Delivery Partners</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map(partner => {
            const supplier = suppliers.find(s => s.id === partner.supplierId);
            return (
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
                    <p className="text-gray-500">Supplier</p>
                    <p className="font-medium text-gray-900">{supplier?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Assigned Customers</p>
                    <p className="font-medium text-gray-900">{partner.assignedCustomers?.length || 0}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDeliveryPartner(partner.id, partner.name)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            );
          })}

          {filteredPartners.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery partners found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomers = () => {
    const filteredCustomers = customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const supplier = suppliers.find(s => s.id === customer.supplierId);
            return (
              <div key={customer.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  {customer.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{customer.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">{customer.address}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Daily Quantity</p>
                    <p className="font-medium text-gray-900">{customer.dailyQuantity} L</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Supplier</p>
                    <p className="font-medium text-gray-900">{supplier?.name || 'Unknown'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFarmers = () => {
    const filteredFarmers = farmers.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.phone.includes(searchTerm)
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Farmers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search farmers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarmers.map(farmer => {
            const supplier = suppliers.find(s => s.id === farmer.supplierId);
            return (
              <div key={farmer.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{farmer.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    farmer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {farmer.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
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
                  <div>
                    <p className="text-gray-500">Supplier</p>
                    <p className="font-medium text-gray-900">{supplier?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFarmers.length === 0 && (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No farmers found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add New Supplier</h3>
                <button
                  onClick={() => setShowAddSupplierModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddSupplier} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupplierData.name}
                      onChange={(e) => setNewSupplierData({...newSupplierData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newSupplierData.email}
                      onChange={(e) => setNewSupplierData({...newSupplierData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username * (for login)
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupplierData.username}
                      onChange={(e) => setNewSupplierData({...newSupplierData, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password * (for login)
                    </label>
                    <input
                      type="text"
                      required
                      value={newSupplierData.password}
                      onChange={(e) => setNewSupplierData({...newSupplierData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Create a password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newSupplierData.phone}
                      onChange={(e) => setNewSupplierData({...newSupplierData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={newSupplierData.licenseNumber}
                      onChange={(e) => setNewSupplierData({...newSupplierData, licenseNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Capacity (L/day)
                    </label>
                    <input
                      type="number"
                      value={newSupplierData.totalCapacity}
                      onChange={(e) => setNewSupplierData({...newSupplierData, totalCapacity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={newSupplierData.address}
                      onChange={(e) => setNewSupplierData({...newSupplierData, address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The supplier will be created with "Approved" status and can log in immediately with the provided credentials.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Supplier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XIcon className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">{user.name}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 rounded-md hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 bg-white shadow-md min-h-screen sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchTerm('');
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchTerm('');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'suppliers' && renderSuppliers()}
          {activeTab === 'delivery-partners' && renderDeliveryPartners()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'farmers' && renderFarmers()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
