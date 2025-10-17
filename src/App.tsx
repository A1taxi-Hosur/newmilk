import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import SupplierLogin from './components/SupplierLogin';
import DeliveryLogin from './components/DeliveryLogin';
import FarmerLogin from './components/FarmerLogin';
import CustomerLogin from './components/CustomerLogin';
import AdminDashboard from './components/AdminDashboard';
import SupplierDashboard from './components/SupplierDashboard';
import DeliveryPartnerDashboard from './components/DeliveryPartnerDashboard';
import FarmerDashboard from './components/FarmerDashboard';
import CustomerPortal from './components/CustomerPortal';
import ProtectedRoute from './components/ProtectedRoute';
import { User, AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { useData } from './context/DataContext';

function AppContent() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const { loading, error } = useData();

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to database...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-red-700 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-2">Please click "Connect to Supabase" in the top right</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard user={currentUser!} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/supplier/login" element={<SupplierLogin onLogin={handleLogin} />} />
        <Route path="/supplier" element={<Navigate to="/supplier/dashboard" replace />} />
        <Route
          path="/supplier/dashboard"
          element={
            <ProtectedRoute allowedRole="supplier">
              <SupplierDashboard user={currentUser!} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/delivery/login" element={<DeliveryLogin onLogin={handleLogin} />} />
        <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
        <Route
          path="/delivery/dashboard"
          element={
            <ProtectedRoute allowedRole="delivery_partner">
              <DeliveryPartnerDashboard user={currentUser!} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/farmer/login" element={<FarmerLogin onLogin={handleLogin} />} />
        <Route path="/farmer" element={<Navigate to="/farmer/dashboard" replace />} />
        <Route
          path="/farmer/dashboard"
          element={
            <ProtectedRoute allowedRole="farmer">
              <FarmerDashboard user={currentUser!} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="/customer/login" element={<CustomerLogin onLogin={handleLogin} />} />
        <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerPortal user={currentUser!} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;