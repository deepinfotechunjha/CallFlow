import { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import useAuthStore from '../store/authStore';
import ExportModal from '../components/ExportModal';

export default function CustomerDirectory() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timePeriod, setTimePeriod] = useState(30);
  const [sortConfig, setSortConfig] = useState({ key: 'lastCallDate', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const { user, token } = useAuthStore();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchTerm, statusFilter, timePeriod, sortConfig]);

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers/analytics');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      );
    }

    // Status filter (Active/Inactive)
    if (statusFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - timePeriod * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(c => {
        if (!c.lastCallDate) return statusFilter === 'inactive';
        const lastCall = new Date(c.lastCallDate);
        const isActive = lastCall >= cutoffDate;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'lastCallDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCustomers(filtered);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatAbsoluteDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (lastCallDate) => {
    if (!lastCallDate) return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">No Calls</span>;
    
    const now = new Date();
    const lastCall = new Date(lastCallDate);
    const diffDays = Math.floor((now - lastCall) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= timePeriod) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">🟢 Active</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">🔴 Inactive</span>;
  };

  const exportToExcel = (dataToExport) => {
    const exportData = dataToExport.map(c => ({
      'Name': c.name,
      'Phone': c.phone,
      'Email': c.email || '',
      'Address': c.address || '',
      'Total Calls': c.totalCalls,
      'Last Call Date': c.lastCallDate ? formatAbsoluteDate(c.lastCallDate) : 'Never',
      'Days Since Last Call': c.lastCallDate ? Math.floor((new Date() - new Date(c.lastCallDate)) / (1000 * 60 * 60 * 24)) : 'N/A',
      'Status': c.lastCallDate && Math.floor((new Date() - new Date(c.lastCallDate)) / (1000 * 60 * 60 * 24)) <= timePeriod ? 'Active' : 'Inactive'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${dataToExport.length} customers to Excel`);
  };

  const handleExport = async (exportType, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/verify-secret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ secretPassword: password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.hasAccess) {
        const dataToExport = exportType === 'filtered' ? filteredCustomers : customers;
        exportToExcel(dataToExport);
        setShowExportModal(false);
      } else {
        toast.error('Invalid secret password');
      }
    } catch (error) {
      toast.error('Failed to verify password');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Directory</h1>
        {user?.role === 'HOST' && (
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            📊 Export
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Customers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
            <option value={99999}>All Time</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Customers</div>
          <div className="text-2xl font-bold text-gray-800">{filteredCustomers.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Active Customers</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredCustomers.filter(c => c.lastCallDate && Math.floor((new Date() - new Date(c.lastCallDate)) / (1000 * 60 * 60 * 24)) <= timePeriod).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Inactive Customers</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredCustomers.filter(c => !c.lastCallDate || Math.floor((new Date() - new Date(c.lastCallDate)) / (1000 * 60 * 60 * 24)) > timePeriod).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Calls</div>
          <div className="text-2xl font-bold text-blue-600">
            {filteredCustomers.reduce((sum, c) => sum + c.totalCalls, 0)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('phone')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Phone {sortConfig.key === 'phone' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  onClick={() => handleSort('totalCalls')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Total Calls {sortConfig.key === 'totalCalls' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('lastCallDate')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Last Call {sortConfig.key === 'lastCallDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.address || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(customer.lastCallDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {customer.totalCalls}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(customer.lastCallDate)}</div>
                      {customer.lastCallDate && (
                        <div className="text-xs text-gray-400">{formatAbsoluteDate(customer.lastCallDate)}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          totalCount={customers.length}
          filteredCount={filteredCustomers.length}
          title="Export Customers to Excel"
        />
      )}
    </div>
  );
}
