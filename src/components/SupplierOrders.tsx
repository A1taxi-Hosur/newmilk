import React, { useState } from 'react';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { useData } from '../context/DataContext';

interface Order {
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
}

const SupplierOrders: React.FC<{ supplierId: string }> = ({ supplierId }) => {
  const { orders, orderItems, customers, products, updateOrderStatus } = useData();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const supplierOrders = orders?.filter(o => o.supplier_id === supplierId) || [];

  const filteredOrders = filterStatus === 'all'
    ? supplierOrders
    : supplierOrders.filter(o => o.status === filterStatus);

  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const statusIcons: { [key: string]: React.ReactNode } = {
    pending: <Clock className="h-5 w-5" />,
    confirmed: <CheckCircle className="h-5 w-5" />,
    preparing: <Package className="h-5 w-5" />,
    out_for_delivery: <Truck className="h-5 w-5" />,
    delivered: <CheckCircle className="h-5 w-5" />,
    cancelled: <XCircle className="h-5 w-5" />
  };

  const getOrderItems = (orderId: string) => {
    return orderItems?.filter(item => item.order_id === orderId) || [];
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (selectedOrder) {
    const items = getOrderItems(selectedOrder.id);

    return (
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
              <p className="text-sm text-gray-500">#{selectedOrder.order_number}</p>
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Back to Orders
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{getCustomerName(selectedOrder.customer_id)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium">{formatDate(selectedOrder.delivery_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-green-600">${selectedOrder.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Delivery Address</p>
              <p className="font-medium">{selectedOrder.delivery_address}</p>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="font-medium">{selectedOrder.notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-2">Status</p>
              <select
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{getProductName(item.product_id)}</p>
                      <p className="text-sm text-gray-500">
                        Quantity: {item.quantity} × ${item.unit_price}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">${item.total_price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Orders Management</h2>

        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders ({supplierOrders.length})
          </button>
          {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'].map(status => {
            const count = supplierOrders.filter(o => o.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {formatStatus(status)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
          <p className="text-gray-500">
            {filterStatus === 'all'
              ? 'You have no orders yet. Orders will appear here when customers place them.'
              : `No orders with status "${formatStatus(filterStatus)}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const items = getOrderItems(order.id);
            const itemCount = items.length;

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">#{order.order_number}</h3>
                    <p className="text-sm text-gray-500">{getCustomerName(order.customer_id)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusColors[order.status]}`}>
                    {statusIcons[order.status]}
                    <span>{formatStatus(order.status)}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Items</p>
                    <p className="font-medium">{itemCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium text-green-600">${order.total_amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Delivery</p>
                    <p className="font-medium">{formatDate(order.delivery_date)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Ordered on {formatDate(order.created_at)}
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;
