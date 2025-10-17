import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, Newspaper, Home, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Calendar, MapPin, DollarSign } from 'lucide-react';
import { User as UserType } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { MonthlyInvoice } from '../lib/customerService';

interface CustomerPortalProps {
  user: UserType;
  onLogout: () => void;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  image_url: string;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { deliveries, customers, products, orders, orderItems, supplierUpdates, getCustomerInvoices, addOrder } = useData();
  const [activeSection, setActiveSection] = useState('home');
  const [invoices, setInvoices] = useState<MonthlyInvoice[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/customer/login');
  };

  const customerPhone = user.phone || user.email;
  const customer = customers.find(c => c.phone === customerPhone || c.email === user.email);
  const customerId = customer?.id || user.id;
  const supplierId = customer?.supplierId || customer?.assigned_supplier_id;

  const myDeliveries = deliveries.filter(d => d.customerId === customerId);
  const myOrders = orders?.filter(o => o.customer_id === customerId) || [];
  const availableProducts = products?.filter(p => p.supplier_id === supplierId && p.in_stock) || [];
  const myUpdates = supplierUpdates?.filter(u => u.supplier_id === supplierId && u.published) || [];

  useEffect(() => {
    if (customerPhone) {
      loadInvoices();
    }
  }, [customerPhone]);

  const loadInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const data = await getCustomerInvoices(customerPhone);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit: product.unit,
        image_url: product.image_url
      }]);
    }
  };

  const updateCartQuantity = (productId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0 || !customer) return;

    try {
      setIsPlacingOrder(true);

      const orderNumber = `ORD-${Date.now()}`;
      const totalAmount = calculateTotal();
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 1);

      const orderData = {
        customer_id: customerId,
        supplier_id: supplierId,
        order_number: orderNumber,
        status: 'pending',
        total_amount: totalAmount,
        delivery_address: customer.address,
        delivery_date: deliveryDate.toISOString().split('T')[0],
        notes: ''
      };

      const orderItemsData = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      await addOrder(orderData, orderItemsData);
      setCart([]);
      setActiveSection('orders');
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOrderItemsForOrder = (orderId: string) => {
    return orderItems?.filter(item => item.order_id === orderId) || [];
  };

  const getProductName = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const renderHome = () => (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h2>
        <p className="text-blue-100">Your daily milk supply partner</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <Package className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myOrders.length}</p>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">
            {myOrders.filter(o => o.status === 'delivered').length}
          </p>
          <p className="text-sm text-gray-600">Delivered</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ShoppingCart className="h-8 w-8 text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{cart.length}</p>
          <p className="text-sm text-gray-600">Cart Items</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <Package className="h-8 w-8 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{availableProducts.length}</p>
          <p className="text-sm text-gray-600">Products</p>
        </div>
      </div>

      {myUpdates.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Newspaper className="h-5 w-5 mr-2 text-blue-600" />
            Latest Updates
          </h3>
          <div className="space-y-3">
            {myUpdates.slice(0, 3).map(update => (
              <div key={update.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <h4 className="font-semibold text-gray-900">{update.title}</h4>
                <p className="text-sm text-gray-600">{update.content}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(update.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        {cart.length > 0 && (
          <button
            onClick={() => setActiveSection('cart')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Cart ({cart.length})</span>
          </button>
        )}
      </div>

      {availableProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
          <p className="text-gray-500">Check back later for available products</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-16 w-16 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-green-600">
                    <span className="text-2xl font-bold">${product.price}</span>
                    <span className="text-sm text-gray-500"> / {product.unit}</span>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {product.category}
                  </span>
                </div>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCart = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-500 mb-6">Add products to your cart to place an order</p>
          <button
            onClick={() => setActiveSection('products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {cart.map(item => (
              <div key={item.product_id} className="p-4 border-b border-gray-200 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">${item.price} / {item.unit}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartQuantity(item.product_id, -1)}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.product_id, 1)}
                      className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-red-600 hover:text-red-700 text-sm mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>$0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {customer && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Delivery Address</p>
                    <p className="text-gray-600">{customer.address}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={placeOrder}
              disabled={isPlacingOrder}
              className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400"
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">Start shopping to place your first order</p>
          <button
            onClick={() => setActiveSection('products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(order => {
            const items = getOrderItemsForOrder(order.id);
            const statusColors: { [key: string]: string } = {
              pending: 'bg-yellow-100 text-yellow-800',
              confirmed: 'bg-blue-100 text-blue-800',
              preparing: 'bg-indigo-100 text-indigo-800',
              out_for_delivery: 'bg-purple-100 text-purple-800',
              delivered: 'bg-green-100 text-green-800',
              cancelled: 'bg-red-100 text-red-800'
            };

            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">#{order.order_number}</h3>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {getProductName(item.product_id)} × {item.quantity}
                      </span>
                      <span className="text-gray-900">${item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Delivery: {formatDate(order.delivery_date)}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    ${order.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderUpdates = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Updates & News</h2>

      {myUpdates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No updates available</h3>
          <p className="text-gray-500">Check back later for news and updates from your supplier</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myUpdates.map(update => {
            const typeColors: { [key: string]: string } = {
              news: 'bg-blue-100 text-blue-800',
              announcement: 'bg-purple-100 text-purple-800',
              promotion: 'bg-green-100 text-green-800'
            };

            return (
              <div key={update.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[update.type]}`}>
                        {update.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(update.created_at)}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{update.title}</h3>
                  </div>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{update.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveSection('home')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeSection === 'home'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setActiveSection('products')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeSection === 'products'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="h-5 w-5" />
              <span>Products</span>
            </button>
            <button
              onClick={() => setActiveSection('cart')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeSection === 'cart'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart {cart.length > 0 && `(${cart.length})`}</span>
            </button>
            <button
              onClick={() => setActiveSection('orders')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeSection === 'orders'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Orders</span>
            </button>
            <button
              onClick={() => setActiveSection('updates')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeSection === 'updates'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Newspaper className="h-5 w-5" />
              <span>Updates</span>
            </button>
            <button
              onClick={handleLogout}
              className="ml-auto flex items-center space-x-2 px-6 py-4 text-red-600 hover:text-red-700 font-medium transition-colors whitespace-nowrap"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="pb-8">
          {activeSection === 'home' && renderHome()}
          {activeSection === 'products' && renderProducts()}
          {activeSection === 'cart' && renderCart()}
          {activeSection === 'orders' && renderOrders()}
          {activeSection === 'updates' && renderUpdates()}
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
