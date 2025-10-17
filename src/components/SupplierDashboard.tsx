import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Truck, Users, Package, Calendar, Milk, ShoppingBag, Newspaper, DollarSign, UserPlus, FileText, PackageOpen, Droplets } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import AllocateMilk from './AllocateMilk';
import AddDeliveryPartner from './AddDeliveryPartner';
import CustomerAssignment from './CustomerAssignment';
import SupplierPricing from './SupplierPricing';
import SupplierProducts from './SupplierProducts';
import SupplierOrders from './SupplierOrders';
import SupplierUpdates from './SupplierUpdates';
import AddCustomer from './AddCustomer';
import FarmerManagement from './FarmerManagement';
import MilkIntake from './MilkIntake';
import DeliveryManagement from './DeliveryManagement';

interface SupplierDashboardProps {
  user: User;
  onLogout: () => void;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { suppliers, deliveryPartners, customers, deliveries, dailyAllocations, farmers, pickupLogs } = useData();
  const [activeTab, setActiveTab] = useState('products');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/supplier/login');
  };

  const supplier = suppliers.find(s => s.id === user.id || s.email === user.email);
  const supplierId = supplier?.id || user.supplierId || user.id;
  const myDeliveryPartners = deliveryPartners.filter(dp => dp.supplierId === supplierId);
  const myCustomers = customers.filter(c => c.supplierId === supplierId);
  const myDeliveries = deliveries.filter(d => d.supplierId === supplierId);
  const myFarmers = farmers.filter(f => f.supplierId === supplierId);

  const menuItems = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'updates', label: 'Updates & News', icon: Newspaper },
    { id: 'delivery-partners', label: 'Delivery Partners', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'farmers', label: 'Farmers', icon: UserPlus },
    { id: 'milk-intake', label: 'Milk Intake', icon: Droplets },
    { id: 'milk-allocation', label: 'Milk Allocation', icon: Milk },
    { id: 'deliveries', label: 'Deliveries', icon: Calendar },
    { id: 'temporary-deliveries', label: 'Temporary Deliveries', icon: PackageOpen },
    { id: 'customer-assignment', label: 'Customer Assignment', icon: FileText },
    { id: 'pricing', label: 'Pricing', icon: DollarSign }
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <SupplierProducts supplierId={supplierId} />;
      case 'orders':
        return <SupplierOrders supplierId={supplierId} />;
      case 'updates':
        return <SupplierUpdates supplierId={supplierId} />;
      case 'delivery-partners':
        return <AddDeliveryPartner supplierId={supplierId} />;
      case 'customers':
        return <AddCustomer supplierId={supplierId} />;
      case 'farmers':
        return <FarmerManagement supplierId={supplierId} />;
      case 'milk-intake':
        return <MilkIntake supplierId={supplierId} />;
      case 'customer-assignment':
        return <CustomerAssignment supplierId={supplierId} />;
      case 'milk-allocation':
        return <AllocateMilk supplierId={supplierId} />;
      case 'pricing':
        return <SupplierPricing supplierId={supplierId} />;
      case 'deliveries':
        return <DeliveryManagement supplierId={supplierId} />;
      case 'temporary-deliveries':
        return (
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Temporary Deliveries</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-center">Temporary delivery management will be added here</p>
            </div>
          </div>
        );
      default:
        return <SupplierProducts supplierId={supplierId} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Supplier Portal</h1>
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
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-white shadow-md min-h-screen sticky top-16">
          <nav className="p-4 space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
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

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu Sidebar */}
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
                  onClick={() => handleTabChange(item.id)}
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

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;
