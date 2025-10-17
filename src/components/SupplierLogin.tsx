import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milk, Eye, EyeOff } from 'lucide-react';
import { User } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import SupplierSignup from './SupplierSignup';

interface SupplierLoginProps {
  onLogin: (user: User) => void;
}

const SupplierLogin: React.FC<SupplierLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { suppliers } = useData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const supplier = suppliers.find(s =>
      s.status === 'approved' &&
      ((s.username === email && s.password === password) ||
       (s.email === email && s.password === password))
    );

    if (supplier) {
      const user: User = {
        id: supplier.id,
        name: supplier.name,
        email: supplier.email,
        role: 'supplier',
        supplierId: supplier.id
      };
      onLogin(user);
      navigate('/supplier/dashboard');
    } else {
      if (email === 'admin@puredairy.com' && password === 'supplier123') {
        const user: User = {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Pure Dairy Farm',
          email: 'admin@puredairy.com',
          role: 'supplier',
          supplierId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        };
        onLogin(user);
        navigate('/supplier/dashboard');
      } else {
        setError('Invalid credentials or account not approved yet.');
      }
    }
  };

  if (showSignup) {
    return <SupplierSignup onBack={() => setShowSignup(false)} onSignupSuccess={() => setShowSignup(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Milk className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">MilkChain Supplier</h2>
          <p className="mt-2 text-sm text-gray-600">Supplier Portal Login</p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Username or Email
              </label>
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter username or email"
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Milk className="h-5 w-5 mr-2" />
              Sign in as Supplier
            </button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setShowSignup(true)}
              className="block w-full text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              New supplier? Sign up here
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500 space-y-2">
            <div className="font-semibold">Demo Credentials:</div>
            <div>Email: admin@puredairy.com</div>
            <div>Password: supplier123</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierLogin;
