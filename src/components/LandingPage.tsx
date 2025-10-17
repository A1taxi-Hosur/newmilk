import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Users, Truck, ShoppingCart, Sprout } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const portals = [
    {
      title: 'Admin Portal',
      description: 'Manage suppliers, customers, delivery partners, and milk allocation',
      icon: Users,
      path: '/admin/login',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Supplier Portal',
      description: 'Manage farmers, milk collection, and view pricing information',
      icon: Milk,
      path: '/supplier/login',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Delivery Partner Portal',
      description: 'View delivery assignments and manage daily deliveries',
      icon: Truck,
      path: '/delivery/login',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'Farmer Portal',
      description: 'Track milk production, collection schedule, and payments',
      icon: Sprout,
      path: '/farmer/login',
      color: 'bg-emerald-600 hover:bg-emerald-700'
    },
    {
      title: 'Customer Portal',
      description: 'Manage subscriptions, view deliveries, and track invoices',
      icon: ShoppingCart,
      path: '/customer/login',
      color: 'bg-cyan-600 hover:bg-cyan-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
            <Milk className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">MilkChain</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Digital Milk Supply Chain Management System
          </p>
          <p className="text-base text-gray-500 mt-2">
            Streamlining the entire milk supply chain from farm to customer
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            Select Your Portal
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.path}
                  className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer transform hover:scale-105"
                  onClick={() => navigate(portal.path)}
                >
                  <div className={`${portal.color} p-6 transition-colors`}>
                    <Icon className="h-12 w-12 text-white mx-auto" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                      {portal.title}
                    </h3>
                    <p className="text-gray-600 text-sm text-center">
                      {portal.description}
                    </p>
                    <button
                      className={`mt-4 w-full py-2 px-4 rounded-md text-white font-medium ${portal.color} transition-colors`}
                    >
                      Access Portal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            How MilkChain Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                <Sprout className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Collection</h4>
              <p className="text-sm text-gray-600">
                Farmers and suppliers manage milk collection and quality tracking
              </p>
            </div>
            <div>
              <div className="bg-orange-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                <Truck className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Distribution</h4>
              <p className="text-sm text-gray-600">
                Delivery partners receive assignments and complete daily deliveries
              </p>
            </div>
            <div>
              <div className="bg-cyan-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="h-8 w-8 text-cyan-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Consumption</h4>
              <p className="text-sm text-gray-600">
                Customers receive fresh milk and manage their subscriptions
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by MilkChain Digital Supply Chain System</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
