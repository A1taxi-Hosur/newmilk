import React, { useState } from 'react';
import { Download, Calendar, Truck, Package, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';

interface DeliveryManagementProps {
  supplierId: string;
}

const DeliveryManagement: React.FC<DeliveryManagementProps> = ({ supplierId }) => {
  const { deliveries, customers, deliveryPartners } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const myDeliveries = deliveries.filter(d => d.supplierId === supplierId);

  const filteredDeliveries = myDeliveries.filter(delivery => {
    const customer = customers.find(c => c.id === delivery.customerId);
    const partner = deliveryPartners.find(dp => dp.id === delivery.deliveryPartnerId);

    const matchesSearch = searchTerm === '' ||
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = delivery.date === filterDate;
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const todayDeliveries = myDeliveries.filter(d => d.date === new Date().toISOString().split('T')[0]);
  const completedToday = todayDeliveries.filter(d => d.status === 'completed').length;
  const pendingToday = todayDeliveries.filter(d => d.status === 'pending').length;
  const totalQuantityToday = todayDeliveries.reduce((sum, d) => sum + d.quantity, 0);

  const downloadExcel = () => {
    const headers = [
      'Date',
      'Customer Name',
      'Customer Address',
      'Delivery Partner',
      'Vehicle Number',
      'Quantity (L)',
      'Status',
      'Scheduled Time',
      'Completed Time',
      'Notes'
    ];

    const csvData = filteredDeliveries.map(delivery => {
      const customer = customers.find(c => c.id === delivery.customerId);
      const partner = deliveryPartners.find(dp => dp.id === delivery.deliveryPartnerId);

      return [
        delivery.date,
        customer?.name || 'Unknown',
        customer?.address || '',
        partner?.name || 'Unknown',
        partner?.vehicleNumber || '',
        delivery.quantity,
        delivery.status,
        delivery.scheduledTime,
        delivery.completedTime || '',
        delivery.notes || ''
      ];
    });

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deliveries-${filterDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery Management</h2>
          <p className="text-sm text-gray-500">Track and manage all milk deliveries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Deliveries</p>
              <p className="text-2xl font-bold text-blue-600">{todayDeliveries.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedToday}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingToday}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-purple-600">{totalQuantityToday}L</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customer or partner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <button
            onClick={downloadExcel}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download Excel</span>
          </button>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
            <p className="text-gray-500">No deliveries match your search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeliveries.map((delivery) => {
                  const customer = customers.find(c => c.id === delivery.customerId);
                  const partner = deliveryPartners.find(dp => dp.id === delivery.deliveryPartnerId);

                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{delivery.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{customer?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{customer?.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{partner?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{partner?.vehicleNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{delivery.quantity}L</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.scheduledTime}
                        {delivery.completedTime && (
                          <div className="text-xs text-green-600">Done: {delivery.completedTime}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(delivery.status)}
                          {getStatusBadge(delivery.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{delivery.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-sm font-semibold text-gray-900">Total</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    {filteredDeliveries.reduce((sum, d) => sum + d.quantity, 0)}L
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryManagement;
