import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import useAuthStore from '../store/authStore';

const CustomerDirectory = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers/directory');
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    if (sortConfig.direction === 'asc') return '↑';
    if (sortConfig.direction === 'desc') return '↓';
    return '↕️';
  };

  let filteredCustomers = customers.filter(customer => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query) ||
      (customer.email && customer.email.toLowerCase().includes(query))
    );
  });

  if (sortConfig.key && sortConfig.direction) {
    filteredCustomers.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name': aVal = a.name || ''; bVal = b.name || ''; break;
        case 'phone': aVal = a.phone || ''; bVal = b.phone || ''; break;
        case 'outsideCalls': aVal = a.outsideCalls || 0; bVal = b.outsideCalls || 0; break;
        case 'carryInServices': aVal = a.carryInServices || 0; bVal = b.carryInServices || 0; break;
        case 'totalInteractions': aVal = a.totalInteractions || 0; bVal = b.totalInteractions || 0; break;
        case 'lastActivityDate': aVal = a.lastActivityDate || ''; bVal = b.lastActivityDate || ''; break;
        default: return 0;
      }
      if (typeof aVal === 'string') {
        if (sortConfig.direction === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      } else {
        if (sortConfig.direction === 'asc') return aVal - bVal;
        return bVal - aVal;
      }
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700">Customer Directory</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Customers</h3>
          <p className="text-xl sm:text-3xl font-bold text-blue-600">{customers.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Outside Calls</h3>
          <p className="text-xl sm:text-3xl font-bold text-green-600">
            {customers.reduce((sum, c) => sum + (c.outsideCalls || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Carry-In Services</h3>
          <p className="text-xl sm:text-3xl font-bold text-purple-600">
            {customers.reduce((sum, c) => sum + (c.carryInServices || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-700">Total Interactions</h3>
          <p className="text-xl sm:text-3xl font-bold text-orange-600">
            {customers.reduce((sum, c) => sum + (c.totalInteractions || 0), 0)}
          </p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sr.No
              </th>
              <th onClick={() => handleSort('name')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Customer {getSortIcon('name')}
              </th>
              <th onClick={() => handleSort('phone')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Phone {getSortIcon('phone')}
              </th>
              <th onClick={() => handleSort('outsideCalls')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Outside Calls {getSortIcon('outsideCalls')}
              </th>
              <th onClick={() => handleSort('carryInServices')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Carry-In Services {getSortIcon('carryInServices')}
              </th>
              <th onClick={() => handleSort('totalInteractions')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Total {getSortIcon('totalInteractions')}
              </th>
              <th onClick={() => handleSort('lastActivityDate')} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                Last Activity {getSortIcon('lastActivityDate')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.phone}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {customer.outsideCalls || 0}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {customer.carryInServices || 0}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.totalInteractions || 0}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.lastActivityDate 
                      ? new Date(customer.lastActivityDate).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerDirectory;