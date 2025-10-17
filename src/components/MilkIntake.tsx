import React, { useState } from 'react';
import { Plus, X, Milk, Download, Calendar, TrendingUp, DollarSign, BarChart3, Search } from 'lucide-react';
import { useData } from '../context/DataContext';

interface MilkIntakeProps {
  supplierId: string;
}

const MilkIntake: React.FC<MilkIntakeProps> = ({ supplierId }) => {
  const { farmers, pickupLogs, logPickup } = useData();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    farmerId: '',
    quantity: '',
    qualityGrade: 'A' as 'A' | 'B' | 'C',
    fatContent: '',
    pricePerLiter: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const myFarmers = farmers.filter(f => f.supplierId === supplierId);
  const myPickupLogs = pickupLogs.filter(log => log.supplierId === supplierId);
  const filteredLogs = myPickupLogs.filter(log =>
    log.date === filterDate &&
    (searchTerm === '' ||
      myFarmers.find(f => f.id === log.farmerId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const todayLogs = myPickupLogs.filter(log => log.date === new Date().toISOString().split('T')[0]);
  const todayQuantity = todayLogs.reduce((sum, log) => sum + log.quantity, 0);
  const todayAmount = todayLogs.reduce((sum, log) => sum + log.totalAmount, 0);

  const monthLogs = myPickupLogs.filter(log => log.date.startsWith(new Date().toISOString().slice(0, 7)));
  const monthQuantity = monthLogs.reduce((sum, log) => sum + log.quantity, 0);
  const monthAmount = monthLogs.reduce((sum, log) => sum + log.totalAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const quantity = parseFloat(formData.quantity);
      const pricePerLiter = parseFloat(formData.pricePerLiter);
      const fatContent = parseFloat(formData.fatContent);
      const totalAmount = quantity * pricePerLiter;

      await logPickup(
        formData.farmerId,
        '',
        '',
        quantity,
        formData.notes
      );

      alert(`Milk intake recorded successfully!\nQuantity: ${quantity}L\nTotal Amount: ₹${totalAmount.toFixed(2)}`);
      handleCloseModal();
    } catch (error: any) {
      console.error('Error recording milk intake:', error);
      setError(error.message || 'Failed to record milk intake. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      farmerId: '',
      quantity: '',
      qualityGrade: 'A',
      fatContent: '',
      pricePerLiter: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setError('');
  };

  const downloadExcel = () => {
    const headers = ['Date', 'Farmer Name', 'Quantity (L)', 'Quality Grade', 'Fat Content (%)', 'Price/Liter (₹)', 'Total Amount (₹)', 'Notes'];

    const csvData = filteredLogs.map(log => {
      const farmer = myFarmers.find(f => f.id === log.farmerId);
      return [
        log.date,
        farmer?.name || 'Unknown',
        log.quantity,
        log.qualityGrade,
        log.fatContent,
        log.pricePerLiter,
        log.totalAmount,
        log.notes || ''
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
    a.download = `milk-intake-${filterDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const calculateTotalAmount = () => {
    if (formData.quantity && formData.pricePerLiter) {
      return (parseFloat(formData.quantity) * parseFloat(formData.pricePerLiter)).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Milk Intake Management</h2>
          <p className="text-sm text-gray-500">Record and track daily milk collection from farmers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Record Intake</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Collection</p>
              <p className="text-2xl font-bold text-blue-600">{todayQuantity}L</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Milk className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Amount</p>
              <p className="text-2xl font-bold text-green-600">₹{todayAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Month Collection</p>
              <p className="text-2xl font-bold text-purple-600">{monthQuantity}L</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Month Amount</p>
              <p className="text-2xl font-bold text-orange-600">₹{monthAmount.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search farmer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
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

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Milk className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
            <p className="text-gray-500">No milk intake records for the selected date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fat %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/L</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const farmer = myFarmers.find(f => f.id === log.farmerId);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{farmer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.quantity}L</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.qualityGrade === 'A' ? 'bg-green-100 text-green-800' :
                          log.qualityGrade === 'B' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Grade {log.qualityGrade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.fatContent}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{log.pricePerLiter}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{log.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.notes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900">Total</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                    {filteredLogs.reduce((sum, log) => sum + log.quantity, 0)}L
                  </td>
                  <td colSpan={3}></td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-600">
                    ₹{filteredLogs.reduce((sum, log) => sum + log.totalAmount, 0).toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Milk className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Record Milk Intake</h3>
                  <p className="text-sm text-gray-500">Log daily milk collection from farmer</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Farmer *
                  </label>
                  <select
                    name="farmerId"
                    required
                    value={formData.farmerId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose a farmer...</option>
                    {myFarmers.map(farmer => (
                      <option key={farmer.id} value={farmer.id}>{farmer.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (Liters) *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0"
                    step="0.1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 50.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality Grade *
                  </label>
                  <select
                    name="qualityGrade"
                    required
                    value={formData.qualityGrade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Basic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat Content (%) *
                  </label>
                  <input
                    type="number"
                    name="fatContent"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.fatContent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 3.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Liter (₹) *
                  </label>
                  <input
                    type="number"
                    name="pricePerLiter"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricePerLiter}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., 45.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">₹{calculateTotalAmount()}</span>
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
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Recording...' : 'Record Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkIntake;
