import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Milk, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface FarmerDashboardProps {
  user: User;
  onLogout: () => void;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/farmer/login');
  };

  const { farmers, pickupLogs, suppliers } = useData();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const farmer = farmers.find(f => f.userId === user.id || f.phone === user.email);
  const farmerId = farmer?.id || user.id;
  const supplier = suppliers.find(s => s.id === farmer?.supplierId);

  const myPickupLogs = pickupLogs.filter(log => log.farmerId === farmerId);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = myPickupLogs.filter(log => log.date === today);
  const monthLogs = myPickupLogs.filter(log => log.date.startsWith(selectedMonth));

  const todayQuantity = todayLogs.reduce((sum, log) => sum + log.quantity, 0);
  const todayEarnings = todayLogs.reduce((sum, log) => sum + log.totalAmount, 0);

  const monthQuantity = monthLogs.reduce((sum, log) => sum + log.quantity, 0);
  const monthEarnings = monthLogs.reduce((sum, log) => sum + log.totalAmount, 0);
  const avgPricePerLiter = monthQuantity > 0 ? monthEarnings / monthQuantity : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome, {farmer?.name || user.email}</p>
              {supplier && (
                <p className="text-xs text-gray-400">Supplier: {supplier.name}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-blue-50">
                <Milk className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Milk</p>
                <p className="text-2xl font-semibold text-gray-900">{todayQuantity}L</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-green-50">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">₹{todayEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-purple-50">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">{monthQuantity}L</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-md bg-orange-50">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Price/L</p>
                <p className="text-2xl font-semibold text-gray-900">₹{avgPricePerLiter.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Month Selector and Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Milk Supply History</h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Quantity</p>
              <p className="text-2xl font-bold text-blue-900">{monthQuantity}L</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-green-900">₹{monthEarnings.toFixed(2)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Total Deliveries</p>
              <p className="text-2xl font-bold text-orange-900">{monthLogs.length}</p>
            </div>
          </div>

          {/* Supply Records */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Delivery Records</h3>
            {monthLogs.length > 0 ? (
              monthLogs
                .sort((a, b) => new Date(b.pickupTime).getTime() - new Date(a.pickupTime).getTime())
                .map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {new Date(log.pickupTime).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.qualityGrade === 'A'
                            ? 'bg-green-100 text-green-800'
                            : log.qualityGrade === 'B'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          Grade {log.qualityGrade}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Fat Content: {log.fatContent}% | {log.notes || 'No notes'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.pickupTime).toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-blue-600">{log.quantity}L</p>
                      <p className="text-sm text-gray-600">₹{log.pricePerLiter}/L</p>
                      <p className="text-sm font-semibold text-green-600">₹{log.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Milk className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No deliveries recorded</p>
                <p className="text-sm mt-2">No milk supply records for {selectedMonth}</p>
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        {todayLogs.length > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">Today's Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Milk Supplied</p>
                <p className="text-3xl font-bold">{todayQuantity}L</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Earnings</p>
                <p className="text-3xl font-bold">₹{todayEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Deliveries</p>
                <p className="text-3xl font-bold">{todayLogs.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
